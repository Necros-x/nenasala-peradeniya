"use server";

import { revalidatePath } from "next/cache";
import { requireRealInstructorPortalActor } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeachingActionResult = { ok: boolean; error?: string };

const CONTENT_STATUSES = ["draft", "published", "hidden", "archived"] as const;
const LESSON_TYPES = ["video", "text", "document", "external"] as const;
const MAX_LESSON_FILE = 20 * 1024 * 1024;
const LESSON_MIMES: Record<string, string> = {
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
  return text(formData, key) || null;
}
function validHttp(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function validIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function sanitizeFile(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  const base = parts.join(".").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "resource";
  return { extension, base: base.slice(0, 80) };
}
function contentFilePath(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const path = (content as Record<string, unknown>).path;
  return typeof path === "string" ? path : null;
}

async function context(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid internal route." } as const;
  const actor = await requireRealInstructorPortalActor();
  if (!actor) return { error: "Lecturer Portal access is required." } as const;
  return {
    accessKey,
    actor,
    isSuper: actor.roles.includes("super_admin"),
    admin: createAdminClient(),
  } as const;
}

async function canCourse(ctx: Awaited<ReturnType<typeof context>>, courseId: string) {
  if ("error" in ctx) return false;
  if (ctx.isSuper) return true;
  const { data } = await ctx.admin
    .from("classes")
    .select("id")
    .eq("course_id", courseId)
    .eq("instructor_id", ctx.actor.id)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function canClass(ctx: Awaited<ReturnType<typeof context>>, classId: string) {
  if ("error" in ctx) return false;
  let query = ctx.admin.from("classes").select("id,course_id,intake_id,instructor_id").eq("id", classId);
  if (!ctx.isSuper) query = query.eq("instructor_id", ctx.actor.id);
  const { data } = await query.maybeSingle();
  return data ?? null;
}

function revalidate(accessKey: string) {
  revalidatePath(`/internal/${accessKey}/instructor-portal/content`);
  revalidatePath(`/internal/${accessKey}/instructor-portal/classes`);
  revalidatePath(`/internal/${accessKey}/instructor-portal/recordings`);
  revalidatePath(`/internal/${accessKey}/instructor-portal/dashboard`);
  revalidatePath("/student/courses");
  revalidatePath("/student/recordings");
  revalidatePath("/student/schedule");
}

export async function saveTeachingModuleAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const status = text(formData, "status");
  if (!courseId || title.length < 2) return { ok: false, error: "Course and module title are required." };
  if (!CONTENT_STATUSES.includes(status as any)) return { ok: false, error: "Invalid module status." };
  if (!(await canCourse(ctx, courseId))) return { ok: false, error: "You can only manage courses assigned to you." };

  if (id) {
    const { data: existing } = await ctx.admin.from("modules").select("course_id").eq("id", id).maybeSingle();
    if (!existing || existing.course_id !== courseId) return { ok: false, error: "Module not found." };
  }

  let position = 0;
  if (!id) {
    const { data: last } = await ctx.admin.from("modules").select("position").eq("course_id", courseId).order("position", { ascending: false }).limit(1).maybeSingle();
    position = Number(last?.position ?? -1) + 1;
  }
  const payload = { course_id: courseId, title, description, status, ...(id ? {} : { position }) };
  const query = id
    ? ctx.admin.from("modules").update(payload).eq("id", id).eq("course_id", courseId).select("id").single()
    : ctx.admin.from("modules").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { ok: false, error: "Unable to save module." };

  await ctx.admin.from("audit_logs").insert({ actor_id: ctx.actor.id, action: id ? "module.updated_by_instructor" : "module.created_by_instructor", entity_type: "module", entity_id: data.id, metadata: { course_id: courseId } });
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function deleteTeachingModuleAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const { data: module } = await ctx.admin.from("modules").select("course_id").eq("id", id).maybeSingle();
  if (!module || !(await canCourse(ctx, module.course_id))) return { ok: false, error: "Module not found or not permitted." };

  const { data: lessons } = await ctx.admin.from("lessons").select("content").eq("module_id", id);
  const paths = (lessons ?? []).map((row) => contentFilePath(row.content)).filter((value): value is string => Boolean(value));
  const { error } = await ctx.admin.from("modules").delete().eq("id", id);
  if (error) return { ok: false, error: "Unable to delete module." };
  if (paths.length) await ctx.admin.storage.from("lesson-resources").remove(paths).catch(() => undefined);
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function saveTeachingLessonAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const moduleId = text(formData, "module_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const lessonType = text(formData, "lesson_type");
  const status = text(formData, "status");
  const durationRaw = text(formData, "duration_minutes");
  const duration = durationRaw ? Number(durationRaw) : null;
  if (!moduleId || title.length < 2) return { ok: false, error: "Module and lesson title are required." };
  if (!LESSON_TYPES.includes(lessonType as any)) return { ok: false, error: "Invalid lesson type." };
  if (!CONTENT_STATUSES.includes(status as any)) return { ok: false, error: "Invalid lesson status." };
  if (duration !== null && (!Number.isInteger(duration) || duration < 0)) return { ok: false, error: "Invalid duration." };

  const { data: module } = await ctx.admin.from("modules").select("course_id").eq("id", moduleId).maybeSingle();
  if (!module || !(await canCourse(ctx, module.course_id))) return { ok: false, error: "Module is not available to you." };

  let existingContent: any = {};
  if (id) {
    const { data: existing } = await ctx.admin.from("lessons").select("module_id,content").eq("id", id).maybeSingle();
    if (!existing || existing.module_id !== moduleId) return { ok: false, error: "Lesson not found." };
    existingContent = existing.content ?? {};
  }

  let nextContent: Record<string, unknown> = {};
  let uploadedPath: string | null = null;
  if (lessonType === "text") {
    nextContent = { body: text(formData, "body") };
  } else if (lessonType === "video") {
    const url = validHttp(nullableText(formData, "video_url"));
    if (!url) return { ok: false, error: "Enter a valid video URL." };
    nextContent = { url };
  } else if (lessonType === "external") {
    const url = validHttp(nullableText(formData, "external_url"));
    if (!url) return { ok: false, error: "Enter a valid external URL." };
    nextContent = { url, label: text(formData, "external_label") || "Open resource" };
  } else {
    const resource = formData.get("resource");
    if (resource instanceof File && resource.size > 0) {
      if (resource.size > MAX_LESSON_FILE) return { ok: false, error: "Lesson files must be 20 MB or smaller." };
      const { extension, base } = sanitizeFile(resource.name);
      const mime = LESSON_MIMES[extension];
      if (!mime) return { ok: false, error: "Unsupported lesson file type." };
      uploadedPath = `${moduleId}/${crypto.randomUUID()}-${base}.${extension}`;
      const { error } = await ctx.admin.storage.from("lesson-resources").upload(uploadedPath, Buffer.from(await resource.arrayBuffer()), { contentType: mime, upsert: false });
      if (error) return { ok: false, error: "Unable to upload lesson file." };
      nextContent = { path: uploadedPath, filename: resource.name, mime_type: mime, size: resource.size };
    } else {
      const oldPath = contentFilePath(existingContent);
      if (!id || !oldPath) return { ok: false, error: "Choose a file for this document lesson." };
      nextContent = existingContent;
    }
  }

  let position = 0;
  if (!id) {
    const { data: last } = await ctx.admin.from("lessons").select("position").eq("module_id", moduleId).order("position", { ascending: false }).limit(1).maybeSingle();
    position = Number(last?.position ?? -1) + 1;
  }
  const payload = { module_id: moduleId, title, description, lesson_type: lessonType, content: nextContent, duration_minutes: duration, status, ...(id ? {} : { position }) };
  const query = id
    ? ctx.admin.from("lessons").update(payload).eq("id", id).eq("module_id", moduleId).select("id").single()
    : ctx.admin.from("lessons").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) {
    if (uploadedPath) await ctx.admin.storage.from("lesson-resources").remove([uploadedPath]).catch(() => undefined);
    return { ok: false, error: "Unable to save lesson." };
  }
  const oldPath = contentFilePath(existingContent);
  if (oldPath && uploadedPath && oldPath !== uploadedPath) await ctx.admin.storage.from("lesson-resources").remove([oldPath]).catch(() => undefined);
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function deleteTeachingLessonAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const { data: lesson } = await ctx.admin.from("lessons").select("module_id,content").eq("id", id).maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  const { data: module } = await ctx.admin.from("modules").select("course_id").eq("id", lesson.module_id).maybeSingle();
  if (!module || !(await canCourse(ctx, module.course_id))) return { ok: false, error: "Lesson is not available to you." };
  const { error } = await ctx.admin.from("lessons").delete().eq("id", id);
  if (error) return { ok: false, error: "Unable to delete lesson." };
  const path = contentFilePath(lesson.content);
  if (path) await ctx.admin.storage.from("lesson-resources").remove([path]).catch(() => undefined);
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function saveTeachingClassAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const intakeId = text(formData, "intake_id");
  const courseId = text(formData, "course_id");
  const name = text(formData, "name");
  const status = text(formData, "status");
  const startDate = nullableText(formData, "start_date");
  const endDate = nullableText(formData, "end_date");
  if (!intakeId || !courseId || name.length < 2) return { ok: false, error: "Intake, course and class name are required." };
  if (!["draft", "scheduled", "active", "completed", "cancelled"].includes(status)) return { ok: false, error: "Invalid class status." };
  if (startDate && endDate && endDate < startDate) return { ok: false, error: "End date cannot be before start date." };

  if (id && !(await canClass(ctx, id))) return { ok: false, error: "You can only edit your own classes." };
  if (!(await canCourse(ctx, courseId))) return { ok: false, error: "You can only create classes for courses you already teach." };

  const { data: intake } = await ctx.admin.from("intakes").select("programme_id").eq("id", intakeId).maybeSingle();
  if (!intake) return { ok: false, error: "Intake not found." };
  const { data: link } = await ctx.admin.from("programme_courses").select("course_id").eq("programme_id", intake.programme_id).eq("course_id", courseId).maybeSingle();
  if (!link) return { ok: false, error: "That course is not part of the selected intake programme." };

  let instructorId: string | null = ctx.actor.id;
  if (ctx.isSuper) instructorId = nullableText(formData, "instructor_id");
  const payload = { intake_id: intakeId, course_id: courseId, instructor_id: instructorId, name, start_date: startDate, end_date: endDate, status };
  const query = id
    ? ctx.admin.from("classes").update(payload).eq("id", id).select("id").single()
    : ctx.admin.from("classes").insert(payload).select("id").single();
  const { error } = await query;
  if (error) return { ok: false, error: "Unable to save class." };
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function saveTeachingLiveSessionAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const classId = text(formData, "class_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const startsAt = validIso(nullableText(formData, "starts_at"));
  const endsAt = validIso(nullableText(formData, "ends_at"));
  const provider = nullableText(formData, "provider");
  const meetingReference = nullableText(formData, "meeting_reference");
  const rawJoinUrl = nullableText(formData, "join_url");
  const joinUrl = validHttp(rawJoinUrl);
  const status = text(formData, "status");
  if (!classId || title.length < 2 || !startsAt) return { ok: false, error: "Class, title and start time are required." };
  if (rawJoinUrl && !joinUrl) return { ok: false, error: "Join URL must be a valid URL." };
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) return { ok: false, error: "End time must be after start time." };
  if (!["scheduled", "live", "completed", "cancelled"].includes(status)) return { ok: false, error: "Invalid session status." };
  const classRow = await canClass(ctx, classId);
  if (!classRow) return { ok: false, error: "You can only schedule sessions for your classes." };
  if (id) {
    const { data: existing } = await ctx.admin.from("live_sessions").select("class_id").eq("id", id).maybeSingle();
    if (!existing || !(await canClass(ctx, existing.class_id))) return { ok: false, error: "Live session not found." };
  }
  const payload = { class_id: classId, instructor_id: classRow.instructor_id, title, description, starts_at: startsAt, ends_at: endsAt, provider, meeting_reference: meetingReference, join_url: joinUrl, status };
  const query = id
    ? ctx.admin.from("live_sessions").update(payload).eq("id", id).select("id").single()
    : ctx.admin.from("live_sessions").insert(payload).select("id").single();
  const { error } = await query;
  if (error) return { ok: false, error: "Unable to save live session." };
  revalidate(ctx.accessKey);
  return { ok: true };
}

export async function saveTeachingRecordingAction(formData: FormData): Promise<TeachingActionResult> {
  const ctx = await context(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const id = text(formData, "id");
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const provider = nullableText(formData, "provider");
  const rawPlayback = nullableText(formData, "playback_url");
  const playbackUrl = validHttp(rawPlayback);
  const sourceType = text(formData, "source_type");
  const status = text(formData, "status");
  const sourceClassId = nullableText(formData, "source_class_id");
  const sourceLiveSessionId = nullableText(formData, "source_live_session_id");
  const recordedAt = validIso(nullableText(formData, "recorded_at"));
  const durationRaw = text(formData, "duration_minutes");
  const durationSeconds = durationRaw ? Math.round(Number(durationRaw) * 60) : null;
  const classIds = formData.getAll("class_ids").filter((value): value is string => typeof value === "string" && Boolean(value));

  if (!courseId || title.length < 2) return { ok: false, error: "Course and recording title are required." };
  if (!(await canCourse(ctx, courseId))) return { ok: false, error: "You can only add recordings to courses you teach." };
  if (rawPlayback && !playbackUrl) return { ok: false, error: "Playback URL must be valid." };
  if (status === "published" && !playbackUrl) return { ok: false, error: "Published recordings require a playback URL." };
  if (!["live_session", "uploaded", "legacy", "external"].includes(sourceType)) return { ok: false, error: "Invalid recording source." };
  if (!["draft", "processing", "published", "archived"].includes(status)) return { ok: false, error: "Invalid recording status." };
  if (durationRaw && (!Number.isFinite(Number(durationRaw)) || Number(durationRaw) < 0)) return { ok: false, error: "Invalid duration." };

  if (sourceClassId) {
    const sourceClass = await canClass(ctx, sourceClassId);
    if (!sourceClass || sourceClass.course_id !== courseId) return { ok: false, error: "Source class is not available to you." };
  }
  for (const classId of classIds) {
    const assignedClass = await canClass(ctx, classId);
    if (!assignedClass || assignedClass.course_id !== courseId) return { ok: false, error: "A selected class does not belong to this course or instructor." };
  }
  if (sourceLiveSessionId) {
    const { data: session } = await ctx.admin.from("live_sessions").select("class_id").eq("id", sourceLiveSessionId).maybeSingle();
    if (!session || !(await canClass(ctx, session.class_id))) return { ok: false, error: "Source live session is not available to you." };
  }
  if (sourceType === "live_session" && !sourceLiveSessionId) return { ok: false, error: "Choose the source live session." };

  const payload = { course_id: courseId, source_class_id: sourceClassId, source_live_session_id: sourceLiveSessionId, title, description, provider, playback_url: playbackUrl, duration_seconds: durationSeconds, recorded_at: recordedAt, source_type: sourceType, status };
  const query = id
    ? ctx.admin.from("recordings").update(payload).eq("id", id).eq("course_id", courseId).select("id").single()
    : ctx.admin.from("recordings").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { ok: false, error: "Unable to save recording." };

  if (ctx.isSuper) {
    await ctx.admin.from("class_recordings").delete().eq("recording_id", data.id);
  } else {
    const { data: ownedClasses } = await ctx.admin.from("classes").select("id").eq("instructor_id", ctx.actor.id).eq("course_id", courseId);
    const ownedIds = (ownedClasses ?? []).map((row) => row.id);
    if (ownedIds.length) await ctx.admin.from("class_recordings").delete().eq("recording_id", data.id).in("class_id", ownedIds);
  }
  if (classIds.length) {
    const { error: assignmentError } = await ctx.admin.from("class_recordings").insert(classIds.map((classId, position) => ({ class_id: classId, recording_id: data.id, lesson_id: null, position, is_required: false })));
    if (assignmentError) return { ok: false, error: "Recording saved, but class assignments could not be updated." };
  }
  revalidate(ctx.accessKey);
  return { ok: true };
}
