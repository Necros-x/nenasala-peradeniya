"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { enableQuizRetryAction } from "@/lib/actions/admin/quizzes";
import type { AdminQuizAttemptRecord, AdminQuizRecord } from "@/lib/services/quizzes";

export default function InstructorQuizzes({
  quizzes,
  attempts,
}: {
  quizzes: AdminQuizRecord[];
  attempts: AdminQuizAttemptRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function retry(attempt: AdminQuizAttemptRecord) {
    if (!window.confirm(`Enable one additional attempt for ${attempt.student_name}?`)) return;
    const formData = new FormData();
    formData.set("quiz_id", attempt.quiz_id);
    formData.set("student_id", attempt.student_id);
    startTransition(async () => {
      const result = await enableQuizRetryAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to enable quiz retry.");
        return;
      }
      toast.success("One additional quiz attempt enabled.");
      router.refresh();
    });
  }

  const latest = new Map<string, AdminQuizAttemptRecord>();
  for (const attempt of attempts) {
    const key = `${attempt.quiz_id}:${attempt.student_id}`;
    const current = latest.get(key);
    if (!current || attempt.attempt_number > current.attempt_number) latest.set(key, attempt);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Quiz Results</h1>
        <p className="mt-1 text-text-secondary">Review results and explicitly enable another attempt when needed.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-text-secondary">No quizzes are available for your classes.</div>
      ) : (
        <div className="space-y-6">
          {quizzes.map((quiz) => {
            const quizAttempts = attempts.filter((row) => row.quiz_id === quiz.id && row.status === "submitted");
            return (
              <section key={quiz.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">{quiz.course_title} · {quiz.class_name}</p>
                      <h2 className="mt-1 text-lg font-bold text-text-primary">{quiz.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{quiz.question_count} questions · Pass mark {quiz.pass_percentage}%</p>
                    </div>
                    <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-bold capitalize text-text-secondary">{quiz.status}</span>
                  </div>

                  {quizAttempts.length === 0 ? (
                    <p className="mt-5 text-sm text-text-muted">No completed attempts yet.</p>
                  ) : (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Attempt</th>
                            <th className="px-3 py-2">Score</th>
                            <th className="px-3 py-2">Result</th>
                            <th className="px-3 py-2">Retry</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizAttempts.map((attempt) => {
                            const isLatest = latest.get(`${attempt.quiz_id}:${attempt.student_id}`)?.id === attempt.id;
                            return (
                              <tr key={attempt.id} className="border-b border-border/70">
                                <td className="px-3 py-3">
                                  <p className="font-semibold text-text-primary">{attempt.student_name}</p>
                                  <p className="text-xs text-text-muted">{attempt.student_number}</p>
                                </td>
                                <td className="px-3 py-3 text-text-secondary">#{attempt.attempt_number}</td>
                                <td className="px-3 py-3 font-bold text-text-primary">{attempt.percentage == null ? "—" : `${attempt.percentage}%`}</td>
                                <td className="px-3 py-3">
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${attempt.passed ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-error-soft)] text-[var(--color-error)]"}`}>
                                    {attempt.passed ? "Passed" : "Failed"}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  {isLatest ? (
                                    <button
                                      type="button"
                                      disabled={pending || attempt.retry_remaining > 0}
                                      onClick={() => retry(attempt)}
                                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold text-text-primary hover:bg-background disabled:opacity-50"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                      {attempt.retry_remaining > 0 ? "Retry enabled" : "Enable retry"}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-text-muted">Previous attempt</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
