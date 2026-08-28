"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudentAssignmentActionState = { ok: boolean; error?: string };

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeHttpUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "submission";
}

export async function submitAssignmentAction(assignmentId: string, formData: FormData): Promise<StudentAssignmentActionState> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const studentId = userData.user?.id;
  if (userError || !studentId) return { ok: false, error: "Please sign in again." };

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", studentId);
  if (!roleRows?.some((row) => row.role === "student")) return { ok: false, error: "A student account is required." };

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,status,due_at,allow_late,publish_at,classes!inner(intake_id)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (assignmentError || !assignment) return { ok: false, error: "Assignment is unavailable." };

  const classRow = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
  if (!classRow?.intake_id) return { ok: false, error: "Assignment class is unavailable." };

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("student_id", studentId)
    .eq("intake_id", classRow.intake_id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return { ok: false, error: "Your enrollment is not active for this class." };

  const { data: existing } = await supabase
    .from("assignment_submissions")
    .select("id,status,file_path,file_name,file_size,resubmission_allowed,resubmission_count")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  const authorizedResubmission = Boolean(existing?.resubmission_allowed);
  const now = Date.now();
  const isLate = Boolean(assignment.due_at && new Date(assignment.due_at).getTime() < now);

  if (existing && !authorizedResubmission) {
    return { ok: false, error: "Your submission is locked. An administrator or your lecturer must enable resubmission first." };
  }

  if (!existing) {
    if (assignment.status !== "published") return { ok: false, error: "This assignment is not accepting submissions." };
    if (assignment.publish_at && new Date(assignment.publish_at).getTime() > now) return { ok: false, error: "This assignment has not opened yet." };
    if (isLate && !assignment.allow_late) return { ok: false, error: "The submission deadline has passed." };
  } else if (!["published", "closed"].includes(assignment.status)) {
    return { ok: false, error: "This assignment cannot accept the authorized resubmission right now." };
  }

  const textContent = text(formData, "text_content") || null;
  const rawExternal = text(formData, "external_url");
  const externalUrl = rawExternal ? safeHttpUrl(rawExternal) : null;
  if (rawExternal && !externalUrl) return { ok: false, error: "External URL must be a valid http/https URL." };

  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  if (file && file.size > MAX_FILE_SIZE) return { ok: false, error: "Submission files must be 20 MB or smaller." };
  if (file && !ALLOWED_TYPES.has(file.type)) return { ok: false, error: "This file type is not allowed." };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { ok: false, error: "Submission storage is not configured." };
  }

  let newPath: string | null = null;
  let fileName = existing?.file_name ?? null;
  let fileSize = existing?.file_size ?? null;

  if (file) {
    newPath = `${studentId}/${assignmentId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await adminClient.storage
      .from("assignment-submissions")
      .upload(newPath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("Unable to upload assignment submission:", uploadError);
      return { ok: false, error: "Unable to upload the submission file." };
    }
    fileName = file.name;
    fileSize = file.size;
  }

  const finalPath = newPath ?? existing?.file_path ?? null;
  if (!textContent && !externalUrl && !finalPath) {
    if (newPath) await adminClient.storage.from("assignment-submissions").remove([newPath]);
    return { ok: false, error: "Add written work, a link, or a file before submitting." };
  }

  const submittedAt = new Date().toISOString();
  const payload = {
    assignment_id: assignmentId,
    student_id: studentId,
    text_content: textContent,
    external_url: externalUrl,
    file_path: finalPath,
    file_name: fileName,
    file_size: fileSize,
    submitted_at: submittedAt,
    status: isLate ? "late" : "submitted",
    score: null,
    feedback: null,
    graded_by: null,
    graded_at: null,
    resubmission_allowed: false,
    resubmission_count: (existing?.resubmission_count ?? 0) + (existing ? 1 : 0),
    last_resubmitted_at: existing ? submittedAt : null,
  };

  const { error: saveError } = await adminClient
    .from("assignment_submissions")
    .upsert(payload, { onConflict: "assignment_id,student_id" });

  if (saveError) {
    console.error("Unable to save assignment submission:", saveError);
    if (newPath) await adminClient.storage.from("assignment-submissions").remove([newPath]);
    return { ok: false, error: "Unable to save your submission." };
  }

  if (newPath && existing?.file_path && existing.file_path !== newPath) {
    try {
      await adminClient.storage.from("assignment-submissions").remove([existing.file_path]);
    } catch {
      // Best-effort cleanup after the replacement submission has saved.
    }
  }

  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/dashboard");
  revalidatePath("/student/notifications");
  return { ok: true };
}
