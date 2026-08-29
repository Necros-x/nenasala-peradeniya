"use client";

import { useTransition } from "react";
import { ExternalLink, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { gradeSubmissionAction, enableResubmissionAction } from "@/lib/actions/admin/assignments";
import type { AdminAssignmentRecord, AdminSubmissionRecord } from "@/lib/services/assignments";

export default function InstructorAssignments({
  assignments,
  submissions,
}: {
  assignments: AdminAssignmentRecord[];
  submissions: AdminSubmissionRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function grade(event: React.FormEvent<HTMLFormElement>, submissionId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("submission_id", submissionId);
    startTransition(async () => {
      const result = await gradeSubmissionAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save grade.");
        return;
      }
      toast.success("Grade saved and student notified.");
      router.refresh();
    });
  }

  function enableResubmission(submissionId: string) {
    if (!window.confirm("Enable exactly one additional submission attempt for this student?")) return;
    const formData = new FormData();
    formData.set("submission_id", submissionId);
    startTransition(async () => {
      const result = await enableResubmissionAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to enable resubmission.");
        return;
      }
      toast.success("Resubmission enabled and student notified.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Assignments & Grading</h1>
        <p className="mt-1 text-text-secondary">Review submissions from your assigned classes. Assignment creation remains admin-controlled.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Assignments" value={assignments.length} />
        <Stat label="Submissions" value={submissions.length} />
        <Stat label="Awaiting grading" value={submissions.filter((row) => ["submitted", "late"].includes(row.status)).length} />
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-text-secondary">No assignment submissions yet.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <article key={submission.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
              <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">{submission.course_title} · {submission.class_name}</p>
                    <h2 className="mt-1 text-lg font-bold text-text-primary">{submission.assignment_title}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{submission.student_name} · {submission.student_number}</p>
                  </div>
                  <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-bold capitalize text-text-secondary">{submission.status}</span>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">Student work</p>
                    {submission.text_content && <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">{submission.text_content}</p>}
                    <div className="mt-3 flex flex-wrap gap-3">
                      {submission.external_url && (
                        <a href={submission.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                          <ExternalLink className="h-4 w-4" /> External link
                        </a>
                      )}
                      {submission.file_url && (
                        <a href={submission.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                          <FileText className="h-4 w-4" /> {submission.file_name ?? "Submission file"}
                        </a>
                      )}
                    </div>
                    {!submission.text_content && !submission.external_url && !submission.file_url && (
                      <p className="mt-2 text-sm text-text-muted">No text, link or file was attached.</p>
                    )}
                  </div>

                  <form onSubmit={(event) => grade(event, submission.id)} className="rounded-md border border-border bg-background p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">Grade</p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        name="score"
                        type="number"
                        min={0}
                        max={submission.max_points}
                        step="0.01"
                        required
                        defaultValue={submission.score ?? ""}
                        className="h-10 w-28 rounded-md border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <span className="text-sm font-semibold text-text-secondary">/ {submission.max_points}</span>
                    </div>
                    <textarea
                      name="feedback"
                      rows={3}
                      defaultValue={submission.feedback ?? ""}
                      placeholder="Feedback for the student"
                      className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button disabled={pending} type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)] hover:bg-brand-primary-hover disabled:opacity-50">
                        Save grade
                      </button>
                      <button
                        disabled={pending || submission.resubmission_allowed}
                        type="button"
                        onClick={() => enableResubmission(submission.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-bold text-text-primary hover:bg-surface-muted disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {submission.resubmission_allowed ? "Resubmission open" : "Enable resubmission"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
      <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
