"use server";

import { revalidatePath } from "next/cache";
import { requireRealInstructorPortalActor } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type MaterialActionResult = { ok: boolean; error?: string };
const MAX_FILE = 25 * 1024 * 1024;
const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  zip: "application/zip",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function safeName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  const base = parts.join(".").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "material";
  return { extension, base: base.slice(0, 90) };
}
function fileKind(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  return "document";
}

async function context(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid internal route." } as const;
  const actor = await requireRealInstructorPortalActor();
  if (!actor) return { error: "Instructor Portal access is required." } as const;
  return { accessKey, actor, isSuper: actor.roles.includes("super_admin"), admin: createAdminClient() } as const;
}
async function canCourse(ctx: any, courseId: string) {
  if (ctx.isSuper) return true;
  const { data } = await ctx.admin.from("classes").select("id").eq("course_id", courseId).eq("instructor_id", ctx.actor.id).limit(1).maybeSingle();
  return Boolean(data);
}
function revalidate(accessKey: string) {
  revalidatePath(`/internal/${accessKey}/instructor-portal/materials`);
  revalidatePath("/student/materials");
}

export async function saveCourseMaterialAction(formData: FormData): Promise<MaterialActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const description = text(formData, "description") || null;
  const materialType = text(formData, "material_type");
  const isPublished = text(formData, "is_published") === "on" || text(formData, "is_published") === "true";
  if (!courseId || title.length < 2) return { ok: false, error: "Course and material title are required." };
  if (!['file', 'link'].includes(materialType)) return { ok: false, error: "Invalid material type." };
  if (!(await canCourse(ctx, courseId))) return { ok: false, error: "You can only add materials to courses you teach." };

  let existing: any = null;
  if (id) {
    const { data } = await ctx.admin.from("course_materials").select("*").eq("id", id).maybeSingle();
    if (!data || !(await canCourse(ctx, data.course_id))) return { ok: false, error: "Material not found." };
    existing = data;
  }

  let filePath: string | null = materialType === "file" ? existing?.file_path ?? null : null;
  let fileName: string | null = materialType === "file" ? existing?.file_name ?? null : null;
  let mimeType: string | null = materialType === "file" ? existing?.mime_type ?? null : null;
  let fileSize: number | null = materialType === "file" ? existing?.file_size ?? null : null;
  let kind = materialType === "link" ? "link" : existing?.file_kind ?? "document";
  let externalUrl: string | null = null;
  let newPath: string | null = null;

  if (materialType === "link") {
    externalUrl = validUrl(text(formData, "external_url"));
    if (!externalUrl) return { ok: false, error: "Enter a valid http/https link." };
  } else {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE) return { ok: false, error: "Materials must be 25 MB or smaller." };
      const { extension, base } = safeName(file.name);
      const mime = MIME_BY_EXT[extension];
      if (!mime) return { ok: false, error: "Unsupported file. Use PDF, images, Office files, TXT or ZIP." };
      newPath = `${courseId}/${crypto.randomUUID()}-${base}.${extension}`;
      const { error } = await ctx.admin.storage.from("course-materials").upload(newPath, Buffer.from(await file.arrayBuffer()), { contentType: mime, upsert: false });
      if (error) return { ok: false, error: "Unable to upload course material. Run the course-materials SQL setup first." };
      filePath = newPath;
      fileName = file.name;
      mimeType = mime;
      fileSize = file.size;
      kind = fileKind(mime);
    } else if (!filePath) {
      return { ok: false, error: "Choose a file to upload." };
    }
  }

  const payload = {
    course_id: courseId,
    title,
    description,
    material_type: materialType,
    file_kind: kind,
    file_path: filePath,
    file_name: fileName,
    mime_type: mimeType,
    file_size: fileSize,
    external_url: externalUrl,
    is_published: isPublished,
    created_by: ctx.actor.id,
  };
  const query = id
    ? ctx.admin.from("course_materials").update(payload).eq("id", id).select("id").single()
    : ctx.admin.from("course_materials").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) {
    if (newPath) await ctx.admin.storage.from("course-materials").remove([newPath]).catch(() => undefined);
    return { ok: false, error: "Unable to save course material. Run the SQL setup if this is the first time using Materials." };
  }

  if (existing?.file_path && newPath && existing.file_path !== newPath) {
    await ctx.admin.storage.from("course-materials").remove([existing.file_path]).catch(() => undefined);
  }
  if (existing?.file_path && materialType === "link") {
    await ctx.admin.storage.from("course-materials").remove([existing.file_path]).catch(() => undefined);
  }

  await ctx.admin.from("audit_logs").insert({ actor_id: ctx.actor.id, action: id ? "course_material.updated" : "course_material.created", entity_type: "course_material", entity_id: data.id, metadata: { course_id: courseId, material_type: materialType } });
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function deleteCourseMaterialAction(formData: FormData): Promise<MaterialActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const { data } = await ctx.admin.from("course_materials").select("id,course_id,file_path").eq("id", id).maybeSingle();
  if (!data || !(await canCourse(ctx, data.course_id))) return { ok: false, error: "Material not found." };
  const { error } = await ctx.admin.from("course_materials").delete().eq("id", id);
  if (error) return { ok: false, error: "Unable to delete material." };
  if (data.file_path) await ctx.admin.storage.from("course-materials").remove([data.file_path]).catch(() => undefined);
  revalidate(ctx.accessKey);
  return { ok: true };
}
