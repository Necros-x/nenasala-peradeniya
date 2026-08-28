"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/student/components/ui/Badge";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import { submitAssignmentAction } from "@/lib/actions/student/assignments";
import type { StudentAssignmentRecord } from "@/lib/services/assignments";

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

function fileSize(value: number | null) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RealAssignmentDetails({ assignment }: { assignment: StudentAssignmentRecord | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!assignment) {
    return <div className="mx-auto max-w-3xl py-16 text-center"><h1 className="text-2xl font-bold">Assignment unavailable</h1><p className="mt-2 text-[var(--color-text-secondary)]">It may not be published or may not belong to your class.</p><Link href="/student/assignments" className="mt-5 inline-block font-semibold text-[var(--color-primary)]">Back to assignments</Link></div>;
  }

  const submission = assignment.submission;
  const graded = submission?.status === "graded";
  const returned = submission?.status === "returned";
  const resubmissionAllowed = Boolean(submission?.resubmission_allowed);
  const late = Boolean(assignment.due_at && new Date(assignment.due_at).getTime() < Date.now());
  const firstSubmissionAllowed = !submission && assignment.status === "published" && (!late || assignment.allow_late);
  const canSubmit = firstSubmissionAllowed || (Boolean(submission) && resubmissionAllowed && ["published", "closed"].includes(assignment.status));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignment || !canSubmit) return;
    setSaving(true);
    try {
      const result = await submitAssignmentAction(assignment.id, new FormData(event.currentTarget));
      if (!result.ok) return toast.error(result.error ?? "Unable to submit assignment.");
      toast.success(submission ? "Resubmission sent" : "Assignment submitted");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link href="/student/assignments" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" /> Back to assignments</Link>

      <div>
        <div className="mb-3 flex flex-wrap gap-2"><Badge variant="default">{assignment.course_title}</Badge><Badge variant="secondary">{assignment.max_points} points</Badge>{late && <Badge variant="error">Past deadline</Badge>}</div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{assignment.title}</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">{assignment.class_name} • Due {formatDate(assignment.due_at)}</p>
      </div>

      <Card className="p-6">
        {assignment.description && <p className="leading-7 text-[var(--color-text-secondary)]">{assignment.description}</p>}
        {assignment.instructions && <div className="mt-6"><h2 className="mb-2 font-bold text-[var(--color-text-primary)]">Instructions</h2><div className="whitespace-pre-wrap leading-7 text-[var(--color-text-secondary)]">{assignment.instructions}</div></div>}
      </Card>

      {submission && (submission.status === "graded" || submission.status === "returned" || submission.feedback) && (
        <Card className="border-[var(--color-primary)]/20 p-6">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" /><h2 className="font-bold text-[var(--color-text-primary)]">{submission.status === "graded" ? "Grade & Feedback" : resubmissionAllowed ? "Resubmission enabled" : "Submission feedback"}</h2></div>
          {submission.score != null && <p className="mt-4 text-3xl font-bold text-[var(--color-text-primary)]">{submission.score}<span className="text-base font-medium text-[var(--color-text-muted)]"> / {assignment.max_points}</span></p>}
          {resubmissionAllowed && <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">You have permission for one resubmission attempt. Once submitted, it will lock again.</p>}
          {submission.feedback && <p className="mt-4 whitespace-pre-wrap text-[var(--color-text-secondary)]">{submission.feedback}</p>}
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{submission ? resubmissionAllowed ? "Resubmit Assignment" : "Your Submission" : "Submit Assignment"}</h2>
        {submission?.submitted_at && <p className="mt-1 text-sm text-[var(--color-text-muted)]">Last submitted {formatDate(submission.submitted_at)}</p>}

        <form onSubmit={submit} className="mt-5 space-y-5">
          <div><label className="mb-2 block text-sm font-semibold">Written response</label><textarea name="text_content" rows={7} defaultValue={submission?.text_content ?? ""} disabled={!canSubmit} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" placeholder="Add your response or notes here..." /></div>
          <div><label className="mb-2 block text-sm font-semibold">External link</label><input name="external_url" type="url" defaultValue={submission?.external_url ?? ""} disabled={!canSubmit} className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" placeholder="https://..." /></div>

          <div>
            <label className="mb-2 block text-sm font-semibold">File</label>
            {submission?.file_name && (
              <div className="mb-3 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 text-sm"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--color-primary)]" /><span>{submission.file_name}</span><span className="text-[var(--color-text-muted)]">{fileSize(submission.file_size)}</span></div>{submission.file_url && <a href={submission.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">Open <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
            )}
            {canSubmit && <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] p-6 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"><UploadCloud className="h-5 w-5" /> {fileName ?? (submission?.file_name ? "Replace file" : "Choose submission file")}<input name="file" type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png,.webp" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)} /></label>}
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">Maximum 20 MB. PDF, Office documents, ZIP, text and common images are supported.</p>
          </div>

          {canSubmit ? <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? "Submitting..." : submission ? "Submit Resubmission" : "Submit Assignment"}</Button> : <p className="text-sm font-semibold text-[var(--color-text-muted)]">{submission ? "Your submission is locked. Resubmission is only available when an administrator or your lecturer explicitly enables it for you." : assignment.allow_late ? "This assignment is not accepting submissions." : "The submission deadline has passed."}</p>}
        </form>
      </Card>
    </div>
  );
}
