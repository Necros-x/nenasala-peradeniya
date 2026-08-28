"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, FileQuestion, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import { Button } from "@/features/student/components/ui/Button";
import type { StudentQuizRecord } from "@/lib/services/quizzes";

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function statusBadge(quiz: StudentQuizRecord) {
  if (quiz.active_attempt_id) return <Badge variant="warning">In progress</Badge>;
  if (quiz.retry_remaining > 0) return <Badge variant="warning"><RotateCcw className="mr-1 h-3 w-3" /> Retry available</Badge>;
  if (quiz.latest_attempt?.passed) return <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Passed</Badge>;
  if (quiz.latest_attempt) return <Badge variant="error"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
  return <Badge variant="default">Not attempted</Badge>;
}

function buttonLabel(quiz: StudentQuizRecord) {
  if (quiz.active_attempt_id) return "Resume Quiz";
  if (quiz.retry_remaining > 0) return "Start Retry";
  if (!quiz.latest_attempt && quiz.can_start) return "Start Quiz";
  return "View Result";
}

export default function RealQuizzes({ quizzes }: { quizzes: StudentQuizRecord[] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Quizzes</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Take class assessments and review your automatically scored results.</p>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <div className="flex min-h-72 flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary-soft)]">
              <FileQuestion className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No quizzes available</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">Published quizzes for your enrolled classes will appear here automatically.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)]">
                    <FileQuestion className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  {statusBadge(quiz)}
                </div>

                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{quiz.title}</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{quiz.course_title} • {quiz.class_name}</p>
                {quiz.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{quiz.description}</p>}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Questions</p>
                    <p className="mt-1 font-bold text-[var(--color-text-primary)]">{quiz.question_count}</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Pass mark</p>
                    <p className="mt-1 font-bold text-[var(--color-text-primary)]">{quiz.pass_percentage}%</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "Untimed"}</span>
                  <span>Due: {formatDate(quiz.due_at)}</span>
                </div>

                {quiz.latest_attempt && (
                  <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Latest result • Attempt {quiz.latest_attempt.attempt_number}</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{quiz.latest_attempt.score_points}/{quiz.latest_attempt.max_points} points</p></div>
                      <span className={`text-2xl font-bold ${quiz.latest_attempt.passed ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>{quiz.latest_attempt.percentage}%</span>
                    </div>
                  </div>
                )}

                {!quiz.can_start && quiz.latest_attempt && quiz.retry_remaining === 0 && (
                  <p className="mt-4 text-xs text-[var(--color-text-muted)]">Another attempt is locked unless an admin or your lecturer explicitly enables a retry.</p>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 p-4">
                <Link href={`/student/quizzes/${quiz.id}`}>
                  <Button className="w-full">{buttonLabel(quiz)}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
