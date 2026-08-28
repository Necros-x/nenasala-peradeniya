"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { StudentQuizQuestion } from "@/lib/services/quizzes";

export type QuizAttemptActionResult = {
  ok: boolean;
  error?: string;
  session?: {
    id: string;
    attempt_number: number;
    started_at: string;
    expires_at: string | null;
    initial_answers: Record<string, string>;
    questions: StudentQuizQuestion[];
  };
  result?: {
    percentage: number;
    score_points: number;
    max_points: number;
    passed: boolean;
    timed_out: boolean;
    attempt_number: number;
  };
};

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function studentContext() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const studentId = userData.user?.id;
  if (userError || !studentId) return { error: "Please sign in again." as const };

  const { data: student } = await supabase
    .from("student_profiles")
    .select("profile_id")
    .eq("profile_id", studentId)
    .maybeSingle();
  if (!student) return { error: "A student account is required to take quizzes." as const };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { error: "Server administration client is not configured." as const };
  }

  return { supabase, adminClient, studentId };
}

async function safeQuestions(adminClient: ReturnType<typeof createAdminClient>, quizId: string): Promise<StudentQuizQuestion[]> {
  const { data, error } = await adminClient
    .from("quiz_questions")
    .select("id,position,question_type,prompt,options,points")
    .eq("quiz_id", quizId)
    .order("position");
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    id: row.id,
    position: numeric(row.position),
    question_type: row.question_type,
    prompt: row.prompt,
    options: row.question_type === "true_false" ? ["True", "False"] : stringArray(row.options),
    points: numeric(row.points),
  }));
}

function expiry(startedAt: string, minutes: number | null) {
  return minutes ? new Date(new Date(startedAt).getTime() + minutes * 60_000).toISOString() : null;
}

function normalizeAnswer(type: string, value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return type === "true_false" ? trimmed.toLowerCase() : trimmed;
}

async function gradeAttempt(
  adminClient: ReturnType<typeof createAdminClient>,
  attempt: any,
  quiz: any,
  answersInput: Record<string, string>
): Promise<QuizAttemptActionResult> {
  const { data: questions, error: questionError } = await adminClient
    .from("quiz_questions")
    .select("id,question_type,correct_answer,points")
    .eq("quiz_id", quiz.id)
    .order("position");
  if (questionError || !questions?.length) return { ok: false, error: "Quiz questions could not be loaded." };

  const answers: Record<string, string> = {};
  let scorePoints = 0;
  let maxPoints = 0;

  for (const question of questions) {
    const points = numeric(question.points);
    maxPoints += points;
    const answer = normalizeAnswer(question.question_type, answersInput[question.id]);
    if (answer) answers[question.id] = answer;
    const correct = normalizeAnswer(question.question_type, question.correct_answer);
    if (answer && answer === correct) scorePoints += points;
  }

  const percentage = maxPoints > 0 ? Math.round((scorePoints / maxPoints) * 10000) / 100 : 0;
  const passed = percentage >= numeric(quiz.pass_percentage);
  const expiresAt = expiry(attempt.started_at, quiz.time_limit_minutes == null ? null : numeric(quiz.time_limit_minutes));
  const timedOut = Boolean(expiresAt && Date.now() > new Date(expiresAt).getTime());
  const submittedAt = new Date().toISOString();

  const { data: updated, error } = await adminClient
    .from("quiz_attempts")
    .update({
      answers,
      score_points: scorePoints,
      max_points: maxPoints,
      percentage,
      passed,
      timed_out: timedOut,
      status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();
  if (error || !updated) return { ok: false, error: "This attempt has already been submitted." };

  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${quiz.id}`);
  return {
    ok: true,
    result: {
      percentage,
      score_points: scorePoints,
      max_points: maxPoints,
      passed,
      timed_out: timedOut,
      attempt_number: numeric(attempt.attempt_number),
    },
  };
}

export async function startQuizAttemptAction(quizId: string): Promise<QuizAttemptActionResult> {
  if (!quizId) return { ok: false, error: "Quiz is required." };
  const ctx = await studentContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, adminClient, studentId } = ctx;

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id,title,status,publish_at,due_at,time_limit_minutes,pass_percentage,class_id")
    .eq("id", quizId)
    .maybeSingle();
  if (quizError || !quiz) return { ok: false, error: "Quiz is unavailable or you do not have access." };
  if (quiz.status === "archived") return { ok: false, error: "This quiz is archived." };

  const { data: active } = await supabase
    .from("quiz_attempts")
    .select("id,attempt_number,started_at,answers,status")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (active) {
    const expiresAt = expiry(active.started_at, quiz.time_limit_minutes == null ? null : numeric(quiz.time_limit_minutes));
    if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
      return gradeAttempt(adminClient, active, quiz, (active.answers ?? {}) as Record<string, string>);
    }
    const questions = await safeQuestions(adminClient, quizId);
    return {
      ok: true,
      session: {
        id: active.id,
        attempt_number: numeric(active.attempt_number),
        started_at: active.started_at,
        expires_at: expiresAt,
        initial_answers: (active.answers ?? {}) as Record<string, string>,
        questions,
      },
    };
  }

  const { data: previousAttempts } = await supabase
    .from("quiz_attempts")
    .select("attempt_number,status")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false });
  const submittedAttempts = (previousAttempts ?? []).filter((item) => item.status === "submitted");
  const highestAttempt = numeric(previousAttempts?.[0]?.attempt_number);

  const { data: permission } = await supabase
    .from("quiz_attempt_permissions")
    .select("extra_attempts_remaining,extra_attempts_used")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .maybeSingle();
  const retryRemaining = numeric(permission?.extra_attempts_remaining);

  if (submittedAttempts.length === 0) {
    if (quiz.status !== "published") return { ok: false, error: "This quiz is not open for new attempts." };
    if (quiz.due_at && Date.now() > new Date(quiz.due_at).getTime()) {
      return { ok: false, error: "The quiz deadline has passed." };
    }
  } else if (retryRemaining <= 0) {
    return { ok: false, error: "Your attempt is locked. An admin or lecturer must enable another attempt." };
  }

  const questions = await safeQuestions(adminClient, quizId);
  if (questions.length === 0) return { ok: false, error: "This quiz does not have any questions yet." };

  let consumedRetry: { remaining: number; used: number } | null = null;
  if (submittedAttempts.length > 0) {
    const used = numeric(permission?.extra_attempts_used);
    const { data: consumed, error: consumeError } = await adminClient
      .from("quiz_attempt_permissions")
      .update({
        extra_attempts_remaining: retryRemaining - 1,
        extra_attempts_used: used + 1,
      })
      .eq("quiz_id", quizId)
      .eq("student_id", studentId)
      .eq("extra_attempts_remaining", retryRemaining)
      .select("quiz_id")
      .maybeSingle();
    if (consumeError || !consumed) return { ok: false, error: "Retry permission changed. Refresh and try again." };
    consumedRetry = { remaining: retryRemaining, used };
  }

  const startedAt = new Date().toISOString();
  const attemptNumber = highestAttempt + 1;
  const { data: attempt, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: attemptNumber,
      status: "in_progress",
      answers: {},
      started_at: startedAt,
    })
    .select("id,attempt_number,started_at")
    .single();
  if (attemptError || !attempt) {
    console.error("Unable to start quiz attempt:", attemptError);
    if (consumedRetry) {
      await adminClient
        .from("quiz_attempt_permissions")
        .update({
          extra_attempts_remaining: consumedRetry.remaining,
          extra_attempts_used: consumedRetry.used,
        })
        .eq("quiz_id", quizId)
        .eq("student_id", studentId);
    }
    return { ok: false, error: "Unable to start the quiz attempt." };
  }

  revalidatePath("/student/quizzes");
  return {
    ok: true,
    session: {
      id: attempt.id,
      attempt_number: numeric(attempt.attempt_number),
      started_at: attempt.started_at,
      expires_at: expiry(attempt.started_at, quiz.time_limit_minutes == null ? null : numeric(quiz.time_limit_minutes)),
      initial_answers: {},
      questions,
    },
  };
}

export async function submitQuizAttemptAction(
  attemptId: string,
  answers: Record<string, string>
): Promise<QuizAttemptActionResult> {
  if (!attemptId) return { ok: false, error: "Attempt is required." };
  const ctx = await studentContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, adminClient, studentId } = ctx;

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id,quiz_id,student_id,attempt_number,status,started_at")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (attemptError || !attempt) return { ok: false, error: "Quiz attempt could not be found." };
  if (attempt.status !== "in_progress") return { ok: false, error: "This attempt has already been submitted." };

  const { data: quiz, error: quizError } = await adminClient
    .from("quizzes")
    .select("id,time_limit_minutes,pass_percentage")
    .eq("id", attempt.quiz_id)
    .maybeSingle();
  if (quizError || !quiz) return { ok: false, error: "Quiz could not be found." };

  return gradeAttempt(adminClient, attempt, quiz, answers);
}
