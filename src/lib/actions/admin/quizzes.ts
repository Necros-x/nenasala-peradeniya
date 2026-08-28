"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type QuizActionState = { ok: boolean; error?: string };

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

function revalidateQuizPaths(accessKey: string, quizId?: string) {
  revalidatePath(`/internal/${accessKey}/lms/quizzes`);
  revalidatePath("/student/quizzes");
  if (quizId) revalidatePath(`/student/quizzes/${quizId}`);
  revalidatePath("/student/notifications");
}

async function quizHasAttempts(quizId: string) {
  try {
    const { count } = await createAdminClient()
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

async function notifyPublishedQuiz(
  quizId: string,
  classId: string,
  title: string,
  dueAt: string | null,
  publishAt: string | null
) {
  if (publishAt && new Date(publishAt).getTime() > Date.now()) return;

  try {
    const adminClient = createAdminClient();
    const { data: classRow, error: classError } = await adminClient
      .from("classes")
      .select("intake_id")
      .eq("id", classId)
      .maybeSingle();
    if (classError || !classRow?.intake_id) return;

    const { data: enrollments, error: enrollmentError } = await adminClient
      .from("enrollments")
      .select("student_id")
      .eq("intake_id", classRow.intake_id)
      .eq("status", "active");
    if (enrollmentError || !enrollments?.length) return;

    const dueText = dueAt
      ? ` It is due ${new Intl.DateTimeFormat("en-LK", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Colombo",
        }).format(new Date(dueAt))}.`
      : "";

    const { error } = await adminClient.from("notifications").upsert(
      enrollments.map((enrollment) => ({
        user_id: enrollment.student_id,
        title: "New quiz published",
        message: `“${title}” is now available.${dueText}`,
        type: "quiz",
        link: `/student/quizzes/${quizId}`,
        source_key: `quiz-published:${quizId}`,
      })),
      { onConflict: "user_id,source_key", ignoreDuplicates: true }
    );
    if (error) console.error("Quiz saved but publication notifications failed:", error.message);
  } catch (error) {
    console.error("Quiz saved but publication notifications failed:", error);
  }
}

export async function saveQuizAction(formData: FormData): Promise<QuizActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const id = text(formData, "id");
  const classId = text(formData, "class_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const instructions = nullableText(formData, "instructions");
  const publishAt = iso(nullableText(formData, "publish_at"));
  const dueAt = iso(nullableText(formData, "due_at"));
  const status = text(formData, "status");
  const timeLimitRaw = text(formData, "time_limit_minutes");
  const passRaw = text(formData, "pass_percentage");
  const timeLimit = timeLimitRaw ? Number(timeLimitRaw) : null;
  const passPercentage = Number(passRaw || "60");

  if (!classId || title.length < 2) return { ok: false, error: "Class and title are required." };
  if (timeLimit !== null && (!Number.isInteger(timeLimit) || timeLimit <= 0)) {
    return { ok: false, error: "Time limit must be a positive whole number of minutes." };
  }
  if (!Number.isFinite(passPercentage) || passPercentage < 0 || passPercentage > 100) {
    return { ok: false, error: "Pass percentage must be between 0 and 100." };
  }
  if (!["draft", "published", "closed", "archived"].includes(status)) {
    return { ok: false, error: "Invalid quiz status." };
  }
  if (publishAt && dueAt && new Date(dueAt).getTime() <= new Date(publishAt).getTime()) {
    return { ok: false, error: "Due date must be after the publish date." };
  }

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,status")
    .eq("id", classId)
    .maybeSingle();
  if (classError || !classRow) return { ok: false, error: "The selected class could not be found." };
  if (classRow.status === "cancelled") return { ok: false, error: "Cannot create a quiz for a cancelled class." };

  if (status === "published") {
    if (!id) return { ok: false, error: "Create the quiz as a draft, add questions, then publish it." };
    const { count } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", id);
    if ((count ?? 0) === 0) return { ok: false, error: "Add at least one question before publishing this quiz." };
  }

  if (id && (await quizHasAttempts(id))) {
    const { data: current } = await supabase
      .from("quizzes")
      .select("class_id,time_limit_minutes,pass_percentage")
      .eq("id", id)
      .maybeSingle();
    if (!current) return { ok: false, error: "Quiz could not be found." };
    if (
      current.class_id !== classId ||
      Number(current.time_limit_minutes ?? 0) !== Number(timeLimit ?? 0) ||
      Number(current.pass_percentage) !== passPercentage
    ) {
      return { ok: false, error: "Class, time limit and pass mark are locked after the first quiz attempt." };
    }
  }

  const payload = {
    class_id: classId,
    title,
    description,
    instructions,
    publish_at: publishAt,
    due_at: dueAt,
    time_limit_minutes: timeLimit,
    pass_percentage: passPercentage,
    status,
    created_by: admin.id,
  };

  const query = id
    ? supabase.from("quizzes").update(payload).eq("id", id).select("id").single()
    : supabase.from("quizzes").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) {
    console.error("Unable to save quiz:", error);
    return { ok: false, error: "Unable to save the quiz." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "quiz.updated" : "quiz.created",
    entity_type: "quiz",
    entity_id: data.id,
    metadata: { class_id: classId, status, pass_percentage: passPercentage, time_limit_minutes: timeLimit },
  });

  if (status === "published") await notifyPublishedQuiz(data.id, classId, title, dueAt, publishAt);
  revalidateQuizPaths(accessKey, data.id);
  return { ok: true };
}

export async function saveQuizQuestionAction(formData: FormData): Promise<QuizActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const id = text(formData, "id");
  const quizId = text(formData, "quiz_id");
  const questionType = text(formData, "question_type");
  const prompt = text(formData, "prompt");
  const correctRaw = text(formData, "correct_answer");
  const points = Number(text(formData, "points") || "1");

  if (!quizId || !prompt) return { ok: false, error: "Quiz and question are required." };
  if (!Number.isFinite(points) || points <= 0) return { ok: false, error: "Question points must be greater than zero." };
  if (!["multiple_choice", "true_false"].includes(questionType)) return { ok: false, error: "Invalid question type." };
  if (await quizHasAttempts(quizId)) return { ok: false, error: "Questions are locked after the first student attempt." };

  let options: string[] = [];
  let correctAnswer = correctRaw;
  if (questionType === "multiple_choice") {
    options = text(formData, "options")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    options = [...new Set(options)];
    if (options.length < 2) return { ok: false, error: "Multiple-choice questions need at least two unique options." };
    if (!options.includes(correctAnswer)) return { ok: false, error: "Correct answer must exactly match one of the options." };
  } else {
    correctAnswer = correctRaw.toLowerCase();
    if (!["true", "false"].includes(correctAnswer)) return { ok: false, error: "Choose True or False as the correct answer." };
    options = ["True", "False"];
  }

  let position = 0;
  if (id) {
    const { data: existing, error: existingError } = await supabase
      .from("quiz_questions")
      .select("id,quiz_id,position")
      .eq("id", id)
      .maybeSingle();
    if (existingError || !existing || existing.quiz_id !== quizId) return { ok: false, error: "Question could not be found." };
    position = existing.position;
  } else {
    const { data: latest } = await supabase
      .from("quiz_questions")
      .select("position")
      .eq("quiz_id", quizId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = Number(latest?.position ?? -1) + 1;
  }

  const payload = {
    quiz_id: quizId,
    position,
    question_type: questionType,
    prompt,
    options,
    correct_answer: correctAnswer,
    points,
  };

  const query = id
    ? supabase.from("quiz_questions").update(payload).eq("id", id).select("id").single()
    : supabase.from("quiz_questions").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) {
    console.error("Unable to save quiz question:", error);
    return { ok: false, error: "Unable to save the question." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "quiz_question.updated" : "quiz_question.created",
    entity_type: "quiz_question",
    entity_id: data.id,
    metadata: { quiz_id: quizId, question_type: questionType, points },
  });
  revalidateQuizPaths(accessKey, quizId);
  return { ok: true };
}

export async function deleteQuizQuestionAction(formData: FormData): Promise<QuizActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;
  const questionId = text(formData, "question_id");
  if (!questionId) return { ok: false, error: "Question is required." };

  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .select("id,quiz_id")
    .eq("id", questionId)
    .maybeSingle();
  if (questionError || !question) return { ok: false, error: "Question could not be found." };
  if (await quizHasAttempts(question.quiz_id)) return { ok: false, error: "Questions are locked after the first student attempt." };

  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) return { ok: false, error: "Unable to delete the question." };

  const { data: remaining } = await supabase
    .from("quiz_questions")
    .select("id,position")
    .eq("quiz_id", question.quiz_id)
    .order("position");
  for (let index = 0; index < (remaining ?? []).length; index += 1) {
    const item = remaining![index];
    if (item.position !== index) await supabase.from("quiz_questions").update({ position: index }).eq("id", item.id);
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "quiz_question.deleted",
    entity_type: "quiz_question",
    entity_id: questionId,
    metadata: { quiz_id: question.quiz_id },
  });
  revalidateQuizPaths(accessKey, question.quiz_id);
  return { ok: true };
}

export async function moveQuizQuestionAction(formData: FormData): Promise<QuizActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, supabase } = ctx;
  const questionId = text(formData, "question_id");
  const direction = text(formData, "direction");
  if (!questionId || !["up", "down"].includes(direction)) return { ok: false, error: "Invalid reorder request." };

  const { data: question, error } = await supabase
    .from("quiz_questions")
    .select("id,quiz_id,position")
    .eq("id", questionId)
    .maybeSingle();
  if (error || !question) return { ok: false, error: "Question could not be found." };
  if (await quizHasAttempts(question.quiz_id)) return { ok: false, error: "Questions are locked after the first student attempt." };

  const targetPosition = question.position + (direction === "up" ? -1 : 1);
  if (targetPosition < 0) return { ok: true };
  const { data: target } = await supabase
    .from("quiz_questions")
    .select("id,position")
    .eq("quiz_id", question.quiz_id)
    .eq("position", targetPosition)
    .maybeSingle();
  if (!target) return { ok: true };

  const { data: maxRow } = await supabase
    .from("quiz_questions")
    .select("position")
    .eq("quiz_id", question.quiz_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const temporary = Number(maxRow?.position ?? targetPosition) + 1;

  const first = await supabase.from("quiz_questions").update({ position: temporary }).eq("id", question.id);
  if (first.error) return { ok: false, error: "Unable to reorder questions." };
  const second = await supabase.from("quiz_questions").update({ position: question.position }).eq("id", target.id);
  if (second.error) return { ok: false, error: "Unable to reorder questions." };
  const third = await supabase.from("quiz_questions").update({ position: targetPosition }).eq("id", question.id);
  if (third.error) return { ok: false, error: "Unable to reorder questions." };

  revalidateQuizPaths(accessKey, question.quiz_id);
  return { ok: true };
}

async function retryReviewerContext(formData: FormData, quizId: string, studentId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const actorId = userData.user?.id;
  if (userError || !actorId) return { error: "Please sign in again." as const };

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", actorId);
  const roles = new Set((roleRows ?? []).map((row) => row.role));
  const isAdmin = roles.has("admin") || roles.has("super_admin");
  const isInstructor = roles.has("instructor");
  if (!isAdmin && !isInstructor) return { error: "You are not allowed to enable quiz retries." as const };

  const accessKey = text(formData, "accessKey");
  if (isAdmin && !isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." as const };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "Server administration client is not configured." as const };
  }

  const { data: quiz, error: quizError } = await adminClient
    .from("quizzes")
    .select("id,title,status,class_id,classes(instructor_id)")
    .eq("id", quizId)
    .maybeSingle();
  if (quizError || !quiz) return { error: "Quiz could not be found." as const };
  const classRow = Array.isArray(quiz.classes) ? quiz.classes[0] : quiz.classes;
  if (!isAdmin && classRow?.instructor_id !== actorId) {
    return { error: "Only the lecturer assigned to this class can enable another attempt." as const };
  }
  if (quiz.status === "archived") return { error: "Archived quizzes cannot be reopened." as const };

  const { count } = await adminClient
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .eq("status", "submitted");
  if ((count ?? 0) === 0) return { error: "The student has not completed an attempt yet." as const };

  return { accessKey, actorId, adminClient, quiz };
}

export async function enableQuizRetryAction(formData: FormData): Promise<QuizActionState> {
  const quizId = text(formData, "quiz_id");
  const studentId = text(formData, "student_id");
  if (!quizId || !studentId) return { ok: false, error: "Quiz and student are required." };

  const ctx = await retryReviewerContext(formData, quizId, studentId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, actorId, adminClient, quiz } = ctx;

  const { data: existing } = await adminClient
    .from("quiz_attempt_permissions")
    .select("extra_attempts_remaining,extra_attempts_used")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (Number(existing?.extra_attempts_remaining ?? 0) > 0) {
    return { ok: false, error: "Another quiz attempt is already enabled for this student." };
  }

  const used = Number(existing?.extra_attempts_used ?? 0);
  const { error } = await adminClient.from("quiz_attempt_permissions").upsert({
    quiz_id: quizId,
    student_id: studentId,
    extra_attempts_remaining: 1,
    extra_attempts_used: used,
    enabled_at: new Date().toISOString(),
    enabled_by: actorId,
  }, { onConflict: "quiz_id,student_id" });
  if (error) {
    console.error("Unable to enable quiz retry:", error);
    return { ok: false, error: "Unable to enable another quiz attempt." };
  }

  const retryNumber = used + 1;
  const { error: notificationError } = await adminClient.from("notifications").upsert({
    user_id: studentId,
    title: "Quiz retry enabled",
    message: `You can take one additional attempt for “${quiz.title}”. Open the quiz when you are ready.`,
    type: "quiz",
    link: `/student/quizzes/${quizId}`,
    source_key: `quiz-retry:${quizId}:${studentId}:${retryNumber}`,
  }, { onConflict: "user_id,source_key", ignoreDuplicates: true });
  if (notificationError) console.error("Retry enabled but notification failed:", notificationError.message);

  await adminClient.from("audit_logs").insert({
    actor_id: actorId,
    action: "quiz_attempt.retry_enabled",
    entity_type: "quiz",
    entity_id: quizId,
    metadata: { student_id: studentId, retry_number: retryNumber },
  });

  if (accessKey) revalidatePath(`/internal/${accessKey}/lms/quizzes`);
  revalidatePath("/instructor/quizzes");
  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${quizId}`);
  revalidatePath("/student/notifications");
  return { ok: true };
}
