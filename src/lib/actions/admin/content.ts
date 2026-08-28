"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ContentActionState = { ok: boolean; error?: string };

const CONTENT_STATUSES = ["draft", "published", "hidden", "archived"] as const;
const LESSON_TYPES = ["video", "text", "document", "external"] as const;
const MAX_RESOURCE_BYTES = 20 * 1024 * 1024;
const RESOURCE_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resourcePathFromContent(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const path = (content as Record<string, unknown>).path;
  return typeof path === "string" && path ? path : null;
}

function sanitizeFilename(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  const base = parts.join(".").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "resource";
  return { base: base.slice(0, 80), extension };
}

async function authorize(accessKey: string) {
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." } as const;
  const admin = await requireRealAdmin();
  if (!admin) {
    return { error: "Demo/preview mode is read-only. Sign in with a real admin account to save changes." } as const;
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." } as const;
  return { admin, supabase } as const;
}

function revalidateContent(accessKey: string, courseId?: string) {
  revalidatePath(`/internal/${accessKey}/lms/content`);
  if (courseId) revalidatePath(`/student/courses/${courseId}`);
}

export async function saveModuleAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const status = text(formData, "status");

  if (!courseId || title.length < 2) return { ok: false, error: "Course and module title are required." };
  if (!CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])) return { ok: false, error: "Invalid module status." };

  let position = 0;
  if (!id) {
    const { data: last } = await auth.supabase
      .from("modules")
      .select("position")
      .eq("course_id", courseId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = (last?.position ?? -1) + 1;
  }

  const payload = {
    course_id: courseId,
    title,
    description,
    status: status as (typeof CONTENT_STATUSES)[number],
    ...(id ? {} : { position }),
  };

  const query = id
    ? auth.supabase.from("modules").update(payload).eq("id", id).eq("course_id", courseId).select("id").single()
    : auth.supabase.from("modules").insert(payload).select("id").single();
  const { data, error } = await query;

  if (error) {
    console.error("Unable to save module:", error);
    return { ok: false, error: "Unable to save the module." };
  }

  await auth.supabase.from("audit_logs").insert({
    actor_id: auth.admin.id,
    action: id ? "module.updated" : "module.created",
    entity_type: "module",
    entity_id: data.id,
    metadata: { course_id: courseId, status },
  });

  revalidateContent(accessKey, courseId);
  return { ok: true };
}

export async function deleteModuleAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  if (!id) return { ok: false, error: "Module not found." };

  const { data: module } = await auth.supabase.from("modules").select("course_id").eq("id", id).maybeSingle();
  if (!module) return { ok: false, error: "Module not found." };

  const { data: lessonRows } = await auth.supabase.from("lessons").select("content").eq("module_id", id);
  const resourcePaths = (lessonRows ?? []).map((row) => resourcePathFromContent(row.content)).filter((value): value is string => Boolean(value));

  const { error } = await auth.supabase.from("modules").delete().eq("id", id);
  if (error) return { ok: false, error: "Unable to delete the module." };

  if (resourcePaths.length) {
    try {
      await createAdminClient().storage.from("lesson-resources").remove(resourcePaths);
    } catch (storageError) {
      console.error("Unable to clean deleted module resources:", storageError);
    }
  }

  await auth.supabase.from("audit_logs").insert({
    actor_id: auth.admin.id,
    action: "module.deleted",
    entity_type: "module",
    entity_id: id,
    metadata: { course_id: module.course_id },
  });

  revalidateContent(accessKey, module.course_id);
  return { ok: true };
}

export async function moveModuleAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id || !["up", "down"].includes(direction)) return { ok: false, error: "Invalid reorder request." };

  const { data: module } = await auth.supabase.from("modules").select("course_id").eq("id", id).maybeSingle();
  if (!module) return { ok: false, error: "Module not found." };

  const { error } = await auth.supabase.rpc("move_module", { p_module_id: id, p_direction: direction });
  if (error) return { ok: false, error: "Unable to reorder the module." };
  revalidateContent(accessKey, module.course_id);
  return { ok: true };
}

export async function saveLessonAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  const moduleId = text(formData, "module_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const lessonType = text(formData, "lesson_type");
  const status = text(formData, "status");
  const durationRaw = text(formData, "duration_minutes");
  const duration = durationRaw ? Number(durationRaw) : null;

  if (!moduleId || title.length < 2) return { ok: false, error: "Module and lesson title are required." };
  if (!LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) return { ok: false, error: "Invalid lesson type." };
  if (!CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])) return { ok: false, error: "Invalid lesson status." };
  if (duration !== null && (!Number.isInteger(duration) || duration < 0 || duration > 10000)) {
    return { ok: false, error: "Duration must be a valid number of minutes." };
  }

  const { data: module } = await auth.supabase.from("modules").select("course_id").eq("id", moduleId).maybeSingle();
  if (!module) return { ok: false, error: "Module not found." };

  let existingContent: unknown = {};
  if (id) {
    const { data: existing, error: existingError } = await auth.supabase
      .from("lessons")
      .select("module_id,content")
      .eq("id", id)
      .maybeSingle();
    if (existingError || !existing || existing.module_id !== moduleId) return { ok: false, error: "Lesson not found." };
    existingContent = existing.content;
  }

  let nextContent: Record<string, unknown> = {};
  let uploadedPath: string | null = null;

  if (lessonType === "text") {
    nextContent = { body: text(formData, "body") };
  } else if (lessonType === "video") {
    const url = text(formData, "video_url");
    if (!validHttpUrl(url)) return { ok: false, error: "Enter a valid video URL." };
    nextContent = { url };
  } else if (lessonType === "external") {
    const url = text(formData, "external_url");
    if (!validHttpUrl(url)) return { ok: false, error: "Enter a valid external URL." };
    nextContent = { url, label: text(formData, "external_label") || "Open resource" };
  } else {
    const resource = formData.get("resource");
    const hasNewResource = resource instanceof File && resource.size > 0;

    if (hasNewResource) {
      if (resource.size > MAX_RESOURCE_BYTES) return { ok: false, error: "Resource files must be 20 MB or smaller." };
      const { base, extension } = sanitizeFilename(resource.name);
      const contentType = RESOURCE_MIME_BY_EXTENSION[extension];
      if (!contentType) return { ok: false, error: "Unsupported resource file. Use PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, ZIP or TXT." };

      uploadedPath = `${moduleId}/${crypto.randomUUID()}-${base}.${extension}`;
      let storage;
      try {
        storage = createAdminClient().storage;
      } catch {
        return { ok: false, error: "Server file storage is not configured." };
      }

      const bytes = Buffer.from(await resource.arrayBuffer());
      const { error: uploadError } = await storage.from("lesson-resources").upload(uploadedPath, bytes, {
        contentType,
        upsert: false,
      });
      if (uploadError) {
        console.error("Unable to upload lesson resource:", uploadError);
        return { ok: false, error: "Unable to upload the resource file." };
      }

      nextContent = {
        path: uploadedPath,
        filename: resource.name,
        mime_type: contentType,
        size: resource.size,
      };
    } else {
      const existingPath = resourcePathFromContent(existingContent);
      if (!id || !existingPath) return { ok: false, error: "Choose a resource file for this document lesson." };
      nextContent = existingContent as Record<string, unknown>;
    }
  }

  let position = 0;
  if (!id) {
    const { data: last } = await auth.supabase
      .from("lessons")
      .select("position")
      .eq("module_id", moduleId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = (last?.position ?? -1) + 1;
  }

  const payload = {
    module_id: moduleId,
    title,
    description,
    lesson_type: lessonType as (typeof LESSON_TYPES)[number],
    content: nextContent,
    duration_minutes: duration,
    status: status as (typeof CONTENT_STATUSES)[number],
    ...(id ? {} : { position }),
  };

  const query = id
    ? auth.supabase.from("lessons").update(payload).eq("id", id).eq("module_id", moduleId).select("id").single()
    : auth.supabase.from("lessons").insert(payload).select("id").single();
  const { data, error } = await query;

  if (error) {
    if (uploadedPath) {
      try { await createAdminClient().storage.from("lesson-resources").remove([uploadedPath]); } catch {}
    }
    console.error("Unable to save lesson:", error);
    return { ok: false, error: "Unable to save the lesson." };
  }

  const oldPath = resourcePathFromContent(existingContent);
  if (oldPath && oldPath !== uploadedPath && (lessonType !== "document" || uploadedPath)) {
    try { await createAdminClient().storage.from("lesson-resources").remove([oldPath]); } catch {}
  }

  await auth.supabase.from("audit_logs").insert({
    actor_id: auth.admin.id,
    action: id ? "lesson.updated" : "lesson.created",
    entity_type: "lesson",
    entity_id: data.id,
    metadata: { module_id: moduleId, course_id: module.course_id, lesson_type: lessonType, status },
  });

  revalidateContent(accessKey, module.course_id);
  return { ok: true };
}

export async function deleteLessonAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  if (!id) return { ok: false, error: "Lesson not found." };

  const { data: lesson } = await auth.supabase.from("lessons").select("module_id,content").eq("id", id).maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  const { data: module } = await auth.supabase.from("modules").select("course_id").eq("id", lesson.module_id).maybeSingle();

  const { error } = await auth.supabase.from("lessons").delete().eq("id", id);
  if (error) return { ok: false, error: "Unable to delete the lesson." };

  const resourcePath = resourcePathFromContent(lesson.content);
  if (resourcePath) {
    try { await createAdminClient().storage.from("lesson-resources").remove([resourcePath]); } catch {}
  }

  await auth.supabase.from("audit_logs").insert({
    actor_id: auth.admin.id,
    action: "lesson.deleted",
    entity_type: "lesson",
    entity_id: id,
    metadata: { module_id: lesson.module_id, course_id: module?.course_id ?? null },
  });

  revalidateContent(accessKey, module?.course_id);
  return { ok: true };
}

export async function moveLessonAction(formData: FormData): Promise<ContentActionState> {
  const accessKey = text(formData, "accessKey");
  const auth = await authorize(accessKey);
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id || !["up", "down"].includes(direction)) return { ok: false, error: "Invalid reorder request." };

  const { data: lesson } = await auth.supabase.from("lessons").select("module_id").eq("id", id).maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  const { data: module } = await auth.supabase.from("modules").select("course_id").eq("id", lesson.module_id).maybeSingle();

  const { error } = await auth.supabase.rpc("move_lesson", { p_lesson_id: id, p_direction: direction });
  if (error) return { ok: false, error: "Unable to reorder the lesson." };
  revalidateContent(accessKey, module?.course_id);
  return { ok: true };
}
