import "server-only";

import type { CalendarEvent } from "@/features/student/types";
import {
  getCurrentStudentAssignments,
  type StudentAssignmentRecord,
} from "@/lib/services/assignments";
import {
  getCurrentStudentQuizzes,
  type StudentQuizRecord,
} from "@/lib/services/quizzes";

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

export type StudentAssessmentResult = {
  id: string;
  kind: "assignment" | "quiz";
  title: string;
  courseTitle: string;
  scoreLabel: string;
  percentage: number | null;
  passed: boolean | null;
  completedAt: string;
  link: string;
};

export type StudentAssessmentSummary = {
  assignmentEvents: CalendarEvent[];
  quizEvents: CalendarEvent[];
  recentResults: StudentAssessmentResult[];
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  quizAttemptsCompleted: number;
  quizzesPassed: number;
};

function assignmentState(assignment: StudentAssignmentRecord): NonNullable<CalendarEvent["assignmentState"]> {
  const submission = assignment.submission;
  if (submission?.status === "graded") return "graded";
  if (submission?.resubmission_allowed) return "resubmission";
  if (submission && ["submitted", "late", "returned"].includes(submission.status)) return "submitted";

  if (!assignment.due_at) return "due";
  const remaining = new Date(assignment.due_at).getTime() - Date.now();
  if (remaining < 0) return "overdue";
  if (remaining <= DUE_SOON_MS) return "due_soon";
  return "due";
}

function quizState(quiz: StudentQuizRecord): NonNullable<CalendarEvent["quizState"]> {
  if (quiz.active_attempt_id) return "in_progress";
  if (quiz.retry_remaining > 0) return "retry";
  if (quiz.latest_attempt?.passed) return "passed";
  if (quiz.latest_attempt) return "failed";

  if (!quiz.due_at) return "due";
  const remaining = new Date(quiz.due_at).getTime() - Date.now();
  if (remaining < 0) return "overdue";
  if (remaining <= DUE_SOON_MS) return "due_soon";
  return "due";
}

function formatDueTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function assignmentEvents(assignments: StudentAssignmentRecord[]): CalendarEvent[] {
  return assignments
    .filter((assignment) => Boolean(assignment.due_at))
    .map((assignment) => {
      const state = assignmentState(assignment);
      const submission = assignment.submission;
      const scoreLabel =
        state === "graded" && submission?.score != null
          ? `${submission.score}/${assignment.max_points}`
          : undefined;

      return {
        id: `assignment:${assignment.id}`,
        title: assignment.title,
        type: "deadline" as const,
        date: assignment.due_at as string,
        time: `Due ${formatDueTime(assignment.due_at as string)}`,
        courseTitle: assignment.course_title,
        description: assignment.description ?? undefined,
        link: `/student/assignments/${assignment.id}`,
        assignmentState: state,
        resultLabel: scoreLabel,
      };
    });
}

function quizEvents(quizzes: StudentQuizRecord[]): CalendarEvent[] {
  return quizzes
    .filter((quiz) => Boolean(quiz.due_at))
    .map((quiz) => ({
      id: `quiz:${quiz.id}`,
      title: quiz.title,
      type: "quiz" as const,
      date: quiz.due_at as string,
      time: `Due ${formatDueTime(quiz.due_at as string)}`,
      courseTitle: quiz.course_title,
      description: quiz.description ?? undefined,
      link: `/student/quizzes/${quiz.id}`,
      quizState: quizState(quiz),
      resultLabel: quiz.latest_attempt ? `${Math.round(quiz.latest_attempt.percentage)}%` : undefined,
    }));
}

function assignmentResults(assignments: StudentAssignmentRecord[]): StudentAssessmentResult[] {
  return assignments.flatMap((assignment) => {
    const submission = assignment.submission;
    if (submission?.status !== "graded" || submission.score == null) return [];
    const completedAt = submission.graded_at ?? submission.submitted_at;
    if (!completedAt) return [];
    const percentage = assignment.max_points > 0
      ? Math.round((submission.score / assignment.max_points) * 100)
      : null;

    return [{
      id: `assignment-result:${submission.id}`,
      kind: "assignment" as const,
      title: assignment.title,
      courseTitle: assignment.course_title,
      scoreLabel: `${submission.score}/${assignment.max_points}`,
      percentage,
      passed: null,
      completedAt,
      link: `/student/assignments/${assignment.id}`,
    }];
  });
}

function quizResults(quizzes: StudentQuizRecord[]): StudentAssessmentResult[] {
  return quizzes.flatMap((quiz) => {
    const attempt = quiz.latest_attempt;
    if (!attempt) return [];
    return [{
      id: `quiz-result:${attempt.id}`,
      kind: "quiz" as const,
      title: quiz.title,
      courseTitle: quiz.course_title,
      scoreLabel: `${attempt.score_points}/${attempt.max_points}`,
      percentage: Math.round(attempt.percentage),
      passed: attempt.passed,
      completedAt: attempt.submitted_at,
      link: `/student/quizzes/${quiz.id}`,
    }];
  });
}

export async function getCurrentStudentAssessmentSummary(): Promise<StudentAssessmentSummary> {
  const [assignments, quizzes] = await Promise.all([
    getCurrentStudentAssignments(),
    getCurrentStudentQuizzes(),
  ]);

  const assignmentEventRows = assignmentEvents(assignments);
  const quizEventRows = quizEvents(quizzes);
  const results = [...assignmentResults(assignments), ...quizResults(quizzes)]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 6);

  return {
    assignmentEvents: assignmentEventRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    quizEvents: quizEventRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    recentResults: results,
    assignmentsSubmitted: assignments.filter((item) => Boolean(item.submission?.submitted_at)).length,
    assignmentsGraded: assignments.filter((item) => item.submission?.status === "graded").length,
    quizAttemptsCompleted: quizzes.filter((item) => Boolean(item.latest_attempt)).length,
    quizzesPassed: quizzes.filter((item) => item.latest_attempt?.passed === true).length,
  };
}
