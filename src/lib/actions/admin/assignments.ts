"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AssignmentActionState = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function iso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function adminContext(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." as const };
  const admin = await requireRealAdmin();
  if (!admin) return { error: "Demo/preview mode is read-only." as const };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };
  return { accessKey, admin, supabase };
}

async function reviewerContext(formData: FormData, submissionId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const actorId = userData.user?.id;
  if (userError || !actorId) return { error: "Please sign in again." as const };

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", actorId);
  const roles = new Set((roleRows ?? []).map((row) => row.role));
  const isAdmin = roles.has("admin") || roles.has("super_admin");
  const isInstructor = roles.has("instructor");
  if (!isAdmin && !isInstructor) return { error: "You are not allowed to review this submission." as const };

  const accessKey = text(formData, "accessKey");
  if (isAdmin && !isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." as const };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "Server administration client is not configured." as const };
  }

  const { data: submission, error: submissionError } = await adminClient
    .from("assignment_submissions")
    .select("id,assignment_id,student_id,status,resubmission_allowed,assignments(title,max_points,status,class_id,classes(instructor_id))")
    .eq("id", submissionId)
    .maybeSingle();
  if (submissionError || !submission) return { error: "Submission could not be found." as const };

  const assignment = Array.isArray(submission.assignments) ? submission.assignments[0] : submission.assignments;
  const classRow = Array.isArray(assignment?.classes) ? assignment.classes[0] : assignment?.classes;
  if (!assignment) return { error: "Assignment could not be found." as const };
  if (!isAdmin && classRow?.instructor_id !== actorId) {
    return { error: "Only the lecturer assigned to this class can review this submission." as const };
  }

  return { accessKey, actorId, adminClient, submission, assignment };
}

function revalidateReviewPaths(accessKey: string, assignmentId: string) {
  if (accessKey) revalidatePath(`/internal/${accessKey}/lms/assignments`);
  revalidatePath("/instructor/assignments");
  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/notifications");
}

export async function saveAssignmentAction(formData: FormData): Promise<AssignmentActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const id = text(formData, "id");
  const classId = text(formData, "class_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const instructions = nullableText(formData, "instructions");
  const dueAt = iso(nullableText(formData, "due_at"));
  const publishAt = iso(nullableText(formData, "publish_at"));
  const allowLate = text(formData, "allow_late") === "true";
  const status = text(formData, "status");
  const maxPointsRaw = text(formData, "max_points");
  const maxPoints = Number(maxPointsRaw || "100");

  if (!classId || title.length < 2) return { ok: false, error: "Class and title are required." };
  if (!Number.isFinite(maxPoints) || maxPoints < 0) return { ok: false, error: "Maximum points must be zero or greater." };
  if (!["draft", "published", "closed", "archived"].includes(status)) return { ok: false, error: "Invalid assignment status." };
  if (publishAt && dueAt && new Date(dueAt).getTime() <= new Date(publishAt).getTime()) {
    return { ok: false, error: "Due date must be after the publish date." };
  }

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,status")
    .eq("id", classId)
    .maybeSingle();
  if (classError || !classRow) return { ok: false, error: "The selected class could not be found." };
  if (classRow.status === "cancelled") return { ok: false, error: "Cannot create an assignment for a cancelled class." };

  const payload = {
    class_id: classId,
    title,
    description,
    instructions,
    due_at: dueAt,
    publish_at: publishAt,
    max_points: maxPoints,
    allow_late: allowLate,
    status,
    created_by: admin.id,
  };

  const query = id
    ? supabase.from("assignments").update(payload).eq("id", id).select("id").single()
    : supabase.from("assignments").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) {
    console.error("Unable to save assignment:", error);
    return { ok: false, error: "Unable to save the assignment." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "assignment.updated" : "assignment.created",
    entity_type: "assignment",
    entity_id: data.id,
    metadata: { class_id: classId, status, max_points: maxPoints },
  });

  revalidatePath(`/internal/${accessKey}/lms/assignments`);
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
  return { ok: true };
}

export async function gradeSubmissionAction(formData: FormData): Promise<AssignmentActionState> {
  const submissionId = text(formData, "submission_id");
  if (!submissionId) return { ok: false, error: "Submission is required." };

  const ctx = await reviewerContext(formData, submissionId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, actorId, adminClient, submission, assignment } = ctx;

  const feedback = nullableText(formData, "feedback");
  const scoreRaw = text(formData, "score");
  const score = scoreRaw ? Number(scoreRaw) : null;
  const maxPoints = Number(assignment.max_points ?? 0);

  if (score === null || !Number.isFinite(score)) return { ok: false, error: "A score is required when grading." };
  if (score < 0 || score > maxPoints) return { ok: false, error: `Score must be between 0 and ${maxPoints}.` };

  const { error } = await adminClient
    .from("assignment_submissions")
    .update({
      status: "graded",
      score,
      feedback,
      graded_by: actorId,
      graded_at: new Date().toISOString(),
      resubmission_allowed: false,
    })
    .eq("id", submissionId);
  if (error) {
    console.error("Unable to grade submission:", error);
    return { ok: false, error: "Unable to save the grade." };
  }

  await adminClient.from("audit_logs").insert({
    actor_id: actorId,
    action: "assignment_submission.graded",
    entity_type: "assignment_submission",
    entity_id: submissionId,
    metadata: { assignment_id: submission.assignment_id, score },
  });

  revalidateReviewPaths(accessKey, submission.assignment_id);
  return { ok: true };
}

export async function enableResubmissionAction(formData: FormData): Promise<AssignmentActionState> {
  const submissionId = text(formData, "submission_id");
  if (!submissionId) return { ok: false, error: "Submission is required." };

  const ctx = await reviewerContext(formData, submissionId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, actorId, adminClient, submission, assignment } = ctx;

  if (submission.resubmission_allowed) return { ok: false, error: "Resubmission is already enabled for this student." };
  if (assignment.status === "archived") return { ok: false, error: "Archived assignments cannot be reopened for resubmission." };

  const feedback = nullableText(formData, "feedback");
  const enabledAt = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: "returned",
    resubmission_allowed: true,
    resubmission_allowed_at: enabledAt,
    resubmission_allowed_by: actorId,
  };
  if (feedback !== null) updatePayload.feedback = feedback;

  const { error: updateError } = await adminClient
    .from("assignment_submissions")
    .update(updatePayload)
    .eq("id", submissionId);
  if (updateError) {
    console.error("Unable to enable assignment resubmission:", updateError);
    return { ok: false, error: "Unable to enable resubmission." };
  }

  const { error: notificationError } = await adminClient.from("notifications").insert({
    user_id: submission.student_id,
    title: "Assignment resubmission enabled",
    message: `You can submit one new attempt for “${assignment.title}”. Open the assignment to resubmit your work.`,
    type: "assignment",
    link: `/student/assignments/${submission.assignment_id}`,
  });
  if (notificationError) {
    console.error("Resubmission was enabled but notification creation failed:", notificationError);
  }

  await adminClient.from("audit_logs").insert({
    actor_id: actorId,
    action: "assignment_submission.resubmission_enabled",
    entity_type: "assignment_submission",
    entity_id: submissionId,
    metadata: { assignment_id: submission.assignment_id, student_id: submission.student_id },
  });

  revalidateReviewPaths(accessKey, submission.assignment_id);
  return { ok: true };
}
