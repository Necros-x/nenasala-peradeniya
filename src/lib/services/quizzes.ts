import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deliverNotification } from "@/lib/notifications/deliver";

export type QuizStatus = "draft" | "published" | "closed" | "archived";
export type QuizQuestionType = "multiple_choice" | "true_false";
export type QuizAnswerValue = string | string[];

export type AdminQuizRecord = {
  id: string;
  class_id: string;
  class_name: string;
  course_title: string;
  intake_name: string;
  title: string;
  description: string | null;
  instructions: string | null;
  publish_at: string | null;
  due_at: string | null;
  time_limit_minutes: number | null;
  pass_percentage: number;
  status: QuizStatus;
  question_count: number;
  total_points: number;
  attempt_count: number;
  created_at: string;
  updated_at: string;
};

export type AdminQuizQuestionRecord = {
  id: string;
  quiz_id: string;
  position: number;
  question_type: QuizQuestionType;
  prompt: string;
  options: string[];
  correct_answers: string[];
  points: number;
};

export type AdminQuizAttemptRecord = {
  id: string;
  quiz_id: string;
  quiz_title: string;
  class_name: string;
  course_title: string;
  student_id: string;
  student_number: string;
  student_name: string;
  student_email: string | null;
  attempt_number: number;
  status: "in_progress" | "submitted";
  score_points: number | null;
  max_points: number | null;
  percentage: number | null;
  passed: boolean | null;
  timed_out: boolean;
  started_at: string;
  submitted_at: string | null;
  retry_remaining: number;
  retries_used: number;
};

export type StudentQuizRecord = {
  id: string;
  class_id: string;
  class_name: string;
  course_title: string;
  title: string;
  description: string | null;
  instructions: string | null;
  publish_at: string | null;
  due_at: string | null;
  time_limit_minutes: number | null;
  pass_percentage: number;
  status: QuizStatus;
  question_count: number;
  total_points: number;
  active_attempt_id: string | null;
  latest_attempt: {
    id: string;
    attempt_number: number;
    percentage: number;
    score_points: number;
    max_points: number;
    passed: boolean;
    timed_out: boolean;
    submitted_at: string;
  } | null;
  retry_remaining: number;
  retries_used: number;
  can_start: boolean;
};

export type StudentQuizQuestion = {
  id: string;
  position: number;
  question_type: QuizQuestionType;
  prompt: string;
  options: string[];
  points: number;
  allows_multiple: boolean;
};

export type StudentQuizSessionData = {
  quiz: StudentQuizRecord;
  attempt: {
    id: string;
    attempt_number: number;
    started_at: string;
    expires_at: string | null;
    initial_answers: Record<string, QuizAnswerValue>;
    questions: StudentQuizQuestion[];
  } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function answerObject(value: unknown): Record<string, QuizAnswerValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, QuizAnswerValue> = {};
  for (const [key, answer] of Object.entries(value as Record<string, unknown>)) {
    if (typeof answer === "string") result[key] = answer;
    else if (Array.isArray(answer)) {
      const values = answer.filter((item): item is string => typeof item === "string");
      if (values.length > 0) result[key] = values;
    }
  }
  return result;
}

const ADMIN_QUIZ_COLUMNS =
  "id,class_id,title,description,instructions,publish_at,due_at,time_limit_minutes,pass_percentage,status,created_at,updated_at,classes(name,status,course_id,intake_id,courses(title),intakes(name))" as const;

const ADMIN_QUESTION_COLUMNS =
  "id,quiz_id,position,question_type,prompt,options,correct_answer,correct_answers,points" as const;

const ADMIN_ATTEMPT_COLUMNS =
  "id,quiz_id,student_id,attempt_number,status,score_points,max_points,percentage,passed,timed_out,started_at,submitted_at,quizzes(title,class_id,classes(name,courses(title))),student_profiles(student_number,profiles(full_name,email))" as const;

const STUDENT_QUIZ_COLUMNS =
  "id,class_id,title,description,instructions,publish_at,due_at,time_limit_minutes,pass_percentage,status,classes!inner(name,status,course_id,courses(title))" as const;

async function syncQuizPublicationNotifications(studentId: string, quizzes: StudentQuizRecord[]) {
  if (quizzes.length === 0) return;

  try {
    await Promise.all(quizzes.map((quiz) => {
      const message = quiz.due_at
        ? `“${quiz.title}” is now available and is due ${new Intl.DateTimeFormat("en-LK", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Colombo",
          }).format(new Date(quiz.due_at))}.`
        : `“${quiz.title}” is now available in ${quiz.course_title}.`;
      return deliverNotification({
        userIds: [studentId],
        title: "New quiz published",
        message,
        type: "quiz",
        link: `/student/quizzes/${quiz.id}`,
        sourceKey: `quiz-published:${quiz.id}`,
        emailCategory: "quizzes",
        actionLabel: "Open quiz",
      });
    }));
  } catch (error) {
    console.error("Unable to sync quiz publication notifications:", error);
  }
}

export async function getAdminQuizzes(): Promise<AdminQuizRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data: quizRows, error: quizError }, { data: questionRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("quizzes").select(ADMIN_QUIZ_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("quiz_questions").select("quiz_id,points"),
    supabase.from("quiz_attempts").select("quiz_id,status"),
  ]);

  if (quizError) {
    console.error("Unable to load quizzes:", quizError.message);
    return [];
  }

  const questionStats = new Map<string, { count: number; points: number }>();
  for (const row of questionRows ?? []) {
    const current = questionStats.get(row.quiz_id) ?? { count: 0, points: 0 };
    current.count += 1;
    current.points += numeric(row.points);
    questionStats.set(row.quiz_id, current);
  }

  const attemptCounts = new Map<string, number>();
  for (const row of attemptRows ?? []) {
    attemptCounts.set(row.quiz_id, (attemptCounts.get(row.quiz_id) ?? 0) + 1);
  }

  return (quizRows ?? []).map((row: any) => {
    const classRow = firstRelation(row.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const intake = firstRelation(classRow?.intakes as any) as any;
    const stats = questionStats.get(row.id) ?? { count: 0, points: 0 };
    return {
      id: row.id,
      class_id: row.class_id,
      class_name: classRow?.name ?? "Class",
      course_title: course?.title ?? "Course",
      intake_name: intake?.name ?? "Intake",
      title: row.title,
      description: row.description ?? null,
      instructions: row.instructions ?? null,
      publish_at: row.publish_at ?? null,
      due_at: row.due_at ?? null,
      time_limit_minutes: row.time_limit_minutes == null ? null : numeric(row.time_limit_minutes),
      pass_percentage: numeric(row.pass_percentage),
      status: row.status,
      question_count: stats.count,
      total_points: stats.points,
      attempt_count: attemptCounts.get(row.id) ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } satisfies AdminQuizRecord;
  });
}

export async function getAdminQuizQuestions(): Promise<AdminQuizQuestionRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(ADMIN_QUESTION_COLUMNS)
    .order("quiz_id")
    .order("position");
  if (error) {
    console.error("Unable to load quiz questions:", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    quiz_id: row.quiz_id,
    position: numeric(row.position),
    question_type: row.question_type,
    prompt: row.prompt,
    options: stringArray(row.options),
    correct_answers: stringArray(row.correct_answers).length > 0 ? stringArray(row.correct_answers) : [row.correct_answer].filter(Boolean),
    points: numeric(row.points),
  }));
}

export async function getAdminQuizAttempts(): Promise<AdminQuizAttemptRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data: attemptRows, error }, { data: permissionRows }] = await Promise.all([
    supabase.from("quiz_attempts").select(ADMIN_ATTEMPT_COLUMNS).order("started_at", { ascending: false }),
    supabase.from("quiz_attempt_permissions").select("quiz_id,student_id,extra_attempts_remaining,extra_attempts_used"),
  ]);
  if (error) {
    console.error("Unable to load quiz attempts:", error.message);
    return [];
  }

  const permissionMap = new Map<string, { remaining: number; used: number }>();
  for (const row of permissionRows ?? []) {
    permissionMap.set(`${row.quiz_id}:${row.student_id}`, {
      remaining: numeric(row.extra_attempts_remaining),
      used: numeric(row.extra_attempts_used),
    });
  }

  return (attemptRows ?? []).map((row: any) => {
    const quiz = firstRelation(row.quizzes as any) as any;
    const classRow = firstRelation(quiz?.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const student = firstRelation(row.student_profiles as any) as any;
    const profile = firstRelation(student?.profiles as any) as any;
    const permission = permissionMap.get(`${row.quiz_id}:${row.student_id}`) ?? { remaining: 0, used: 0 };
    return {
      id: row.id,
      quiz_id: row.quiz_id,
      quiz_title: quiz?.title ?? "Quiz",
      class_name: classRow?.name ?? "Class",
      course_title: course?.title ?? "Course",
      student_id: row.student_id,
      student_number: student?.student_number ?? "—",
      student_name: profile?.full_name ?? "Student",
      student_email: profile?.email ?? null,
      attempt_number: numeric(row.attempt_number),
      status: row.status,
      score_points: row.score_points == null ? null : numeric(row.score_points),
      max_points: row.max_points == null ? null : numeric(row.max_points),
      percentage: row.percentage == null ? null : numeric(row.percentage),
      passed: row.passed == null ? null : Boolean(row.passed),
      timed_out: Boolean(row.timed_out),
      started_at: row.started_at,
      submitted_at: row.submitted_at ?? null,
      retry_remaining: permission.remaining,
      retries_used: permission.used,
    } satisfies AdminQuizAttemptRecord;
  });
}

export async function getCurrentStudentQuizzes(): Promise<StudentQuizRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data: quizRows, error } = await supabase
    .from("quizzes")
    .select(STUDENT_QUIZ_COLUMNS)
    .in("status", ["published", "closed"])
    .in("classes.status", ["scheduled", "active", "completed"])
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("Unable to load student quizzes:", error.message);
    return [];
  }

  const quizIds = (quizRows ?? []).map((row) => row.id);
  if (quizIds.length === 0) return [];

  const [{ data: attempts }, { data: permissions }] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("id,quiz_id,attempt_number,status,score_points,max_points,percentage,passed,timed_out,started_at,submitted_at")
      .in("quiz_id", quizIds)
      .order("attempt_number", { ascending: false }),
    supabase
      .from("quiz_attempt_permissions")
      .select("quiz_id,student_id,extra_attempts_remaining,extra_attempts_used")
      .in("quiz_id", quizIds),
  ]);

  let questionRows: any[] = [];
  try {
    const { data } = await createAdminClient()
      .from("quiz_questions")
      .select("quiz_id,points")
      .in("quiz_id", quizIds);
    questionRows = data ?? [];
  } catch {
    questionRows = [];
  }

  const stats = new Map<string, { count: number; points: number }>();
  for (const row of questionRows) {
    const current = stats.get(row.quiz_id) ?? { count: 0, points: 0 };
    current.count += 1;
    current.points += numeric(row.points);
    stats.set(row.quiz_id, current);
  }

  const attemptsByQuiz = new Map<string, any[]>();
  for (const row of attempts ?? []) {
    const bucket = attemptsByQuiz.get(row.quiz_id) ?? [];
    bucket.push(row);
    attemptsByQuiz.set(row.quiz_id, bucket);
  }

  const permissionsByQuiz = new Map<string, { remaining: number; used: number }>();
  for (const row of permissions ?? []) {
    permissionsByQuiz.set(row.quiz_id, {
      remaining: numeric(row.extra_attempts_remaining),
      used: numeric(row.extra_attempts_used),
    });
  }

  const quizzes = (quizRows ?? []).map((row: any) => {
    const classRow = firstRelation(row.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const quizAttempts = attemptsByQuiz.get(row.id) ?? [];
    const active = quizAttempts.find((item) => item.status === "in_progress") ?? null;
    const latest = quizAttempts.find((item) => item.status === "submitted") ?? null;
    const permission = permissionsByQuiz.get(row.id) ?? { remaining: 0, used: 0 };
    const questionStats = stats.get(row.id) ?? { count: 0, points: 0 };
    const duePassed = row.due_at ? new Date(row.due_at).getTime() < Date.now() : false;
    const hasSubmitted = Boolean(latest);
    const canStart = Boolean(
      active ||
      (questionStats.count > 0 && !hasSubmitted && row.status === "published" && !duePassed) ||
      (questionStats.count > 0 && permission.remaining > 0 && row.status !== "archived")
    );

    return {
      id: row.id,
      class_id: row.class_id,
      class_name: classRow?.name ?? "Class",
      course_title: course?.title ?? "Course",
      title: row.title,
      description: row.description ?? null,
      instructions: row.instructions ?? null,
      publish_at: row.publish_at ?? null,
      due_at: row.due_at ?? null,
      time_limit_minutes: row.time_limit_minutes == null ? null : numeric(row.time_limit_minutes),
      pass_percentage: numeric(row.pass_percentage),
      status: row.status,
      question_count: questionStats.count,
      total_points: questionStats.points,
      active_attempt_id: active?.id ?? null,
      latest_attempt: latest ? {
        id: latest.id,
        attempt_number: numeric(latest.attempt_number),
        percentage: numeric(latest.percentage),
        score_points: numeric(latest.score_points),
        max_points: numeric(latest.max_points),
        passed: Boolean(latest.passed),
        timed_out: Boolean(latest.timed_out),
        submitted_at: latest.submitted_at ?? latest.started_at,
      } : null,
      retry_remaining: permission.remaining,
      retries_used: permission.used,
      can_start: canStart,
    } satisfies StudentQuizRecord;
  });

  await syncQuizPublicationNotifications(userData.user.id, quizzes);
  return quizzes;
}

async function safeQuestions(quizId: string): Promise<StudentQuizQuestion[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("quiz_questions")
      .select("id,position,question_type,prompt,options,correct_answer,correct_answers,points")
      .eq("quiz_id", quizId)
      .order("position");
    if (error) return [];
    return (data ?? []).map((row: any) => {
      const correctAnswers = stringArray(row.correct_answers).length > 0
        ? stringArray(row.correct_answers)
        : [row.correct_answer].filter(Boolean);
      return {
        id: row.id,
        position: numeric(row.position),
        question_type: row.question_type,
        prompt: row.prompt,
        options: row.question_type === "true_false" ? ["True", "False"] : stringArray(row.options),
        points: numeric(row.points),
        allows_multiple: row.question_type === "multiple_choice" && correctAnswers.length > 1,
      };
    });
  } catch {
    return [];
  }
}

export async function getCurrentStudentQuizSession(quizId: string): Promise<StudentQuizSessionData | null> {
  const quizzes = await getCurrentStudentQuizzes();
  const quiz = quizzes.find((item) => item.id === quizId) ?? null;
  if (!quiz) return null;
  if (!quiz.active_attempt_id) return { quiz, attempt: null };

  const supabase = await createClient();
  if (!supabase) return { quiz, attempt: null };
  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .select("id,attempt_number,started_at,answers,status")
    .eq("id", quiz.active_attempt_id)
    .maybeSingle();
  if (error || !attempt || attempt.status !== "in_progress") return { quiz, attempt: null };

  const questions = await safeQuestions(quiz.id);
  const expiresAt = quiz.time_limit_minutes
    ? new Date(new Date(attempt.started_at).getTime() + quiz.time_limit_minutes * 60_000).toISOString()
    : null;

  return {
    quiz,
    attempt: {
      id: attempt.id,
      attempt_number: numeric(attempt.attempt_number),
      started_at: attempt.started_at,
      expires_at: expiresAt,
      initial_answers: answerObject(attempt.answers),
      questions,
    },
  };
}
