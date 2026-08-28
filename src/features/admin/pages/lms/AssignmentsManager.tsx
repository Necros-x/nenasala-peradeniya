"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Edit2, ExternalLink, FileText, Plus, RotateCcw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/ui/dialog";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import { enableResubmissionAction, gradeSubmissionAction, saveAssignmentAction } from "@/lib/actions/admin/assignments";
import type { ClassRecord } from "@/lib/services/classes";
import type { AdminAssignmentRecord, AdminSubmissionRecord, AssignmentStatus, SubmissionStatus } from "@/lib/services/assignments";

type Props = {
  classes: ClassRecord[];
  assignments: AdminAssignmentRecord[];
  submissions: AdminSubmissionRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
};

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

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function assignmentVariant(status: AssignmentStatus): "secondary" | "success" | "warning" | "outline" {
  if (status === "published") return "success";
  if (status === "closed") return "warning";
  if (status === "archived") return "outline";
  return "secondary";
}

function submissionVariant(status: SubmissionStatus): "secondary" | "success" | "warning" | "danger" | "info" {
  if (status === "graded") return "success";
  if (status === "returned") return "warning";
  if (status === "late") return "danger";
  if (status === "submitted") return "info";
  return "secondary";
}

export default function AssignmentsManager({ classes, assignments, submissions, accessKey, readOnlyDemo }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"assignments" | "submissions">("assignments");
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAssignmentRecord | null>(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [grading, setGrading] = useState<AdminSubmissionRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const activeClasses = useMemo(() => classes.filter((item) => item.status !== "cancelled"), [classes]);
  const submittedCount = submissions.filter((item) => ["submitted", "late"].includes(item.status)).length;
  const gradedCount = submissions.filter((item) => item.status === "graded").length;

  function beginCreate() {
    setEditing(null);
    setAssignmentOpen(true);
  }

  function beginEdit(item: AdminAssignmentRecord) {
    setEditing(item);
    setAssignmentOpen(true);
  }

  function beginGrade(item: AdminSubmissionRecord) {
    setGrading(item);
    setGradeOpen(true);
  }

  async function submitAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      if (editing) formData.set("id", editing.id);
      for (const key of ["publish_at", "due_at"]) {
        const raw = formData.get(key);
        if (typeof raw === "string" && raw) formData.set(key, new Date(raw).toISOString());
      }
      formData.set("allow_late", formData.get("allow_late") === "on" ? "true" : "false");
      const result = await saveAssignmentAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save assignment.");
      toast.success(editing ? "Assignment updated" : "Assignment created");
      setAssignmentOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitGrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!grading || readOnlyDemo) return;
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      formData.set("submission_id", grading.id);
      const result = await gradeSubmissionAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save grade.");
      toast.success("Submission graded");
      setGradeOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }


  async function allowResubmission(item: AdminSubmissionRecord) {
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    if (item.resubmission_allowed) return toast.info("Resubmission is already enabled for this student.");
    if (!window.confirm(`Enable one resubmission attempt for ${item.student_name}? They will receive a notification.`)) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("submission_id", item.id);
      const result = await enableResubmissionAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to enable resubmission.");
      toast.success("Resubmission enabled and student notified");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Assignments & Grading</h1>
          <p className="mt-1 text-text-secondary">Create class assignments, review student work and return grades or revision feedback.</p>
        </div>
        <Button onClick={beginCreate} disabled={readOnlyDemo || activeClasses.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> New Assignment
        </Button>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">Demo mode is read-only.</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><ClipboardList className="h-6 w-6 text-brand-primary" /><div><p className="text-2xl font-bold">{assignments.length}</p><p className="text-sm text-text-secondary">Assignments</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><UsersRound className="h-6 w-6 text-info" /><div><p className="text-2xl font-bold">{submittedCount}</p><p className="text-sm text-text-secondary">Awaiting grading</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><CheckCircle2 className="h-6 w-6 text-success" /><div><p className="text-2xl font-bold">{gradedCount}</p><p className="text-sm text-text-secondary">Graded submissions</p></div></CardContent></Card>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <Button variant={tab === "assignments" ? "default" : "ghost"} onClick={() => setTab("assignments")}>Assignments</Button>
        <Button variant={tab === "submissions" ? "default" : "ghost"} onClick={() => setTab("submissions")}>Submissions</Button>
      </div>

      {tab === "assignments" ? (
        assignments.length === 0 ? (
          <Card><CardContent className="p-10 text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-brand-primary" /><h2 className="font-semibold">No assignments yet</h2><p className="mt-1 text-sm text-text-secondary">Create the first assignment for one of your classes.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {assignments.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={assignmentVariant(item.status)}>{item.status}</Badge><span className="text-xs text-text-muted">{item.max_points} pts</span></div>
                      <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{item.course_title} • {item.class_name}</p>
                      <p className="mt-3 text-sm text-text-muted">Due: {formatDate(item.due_at)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => beginEdit(item)} disabled={readOnlyDemo}><Edit2 className="mr-2 h-4 w-4" /> Edit</Button>
                  </div>
                  {item.description && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : submissions.length === 0 ? (
        <Card><CardContent className="p-10 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-brand-primary" /><h2 className="font-semibold">No submissions yet</h2><p className="mt-1 text-sm text-text-secondary">Student work will appear here after submission.</p></CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Assignment</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Score</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {submissions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4"><p className="font-semibold text-foreground">{item.student_name}</p><p className="text-xs text-text-muted">{item.student_number}</p></td>
                    <td className="px-5 py-4"><p className="font-medium text-foreground">{item.assignment_title}</p><p className="text-xs text-text-muted">{item.course_title}</p></td>
                    <td className="px-5 py-4 text-text-secondary">{formatDate(item.submitted_at)}</td>
                    <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={submissionVariant(item.status)}>{item.status}</Badge>{item.resubmission_allowed && <Badge variant="warning">Resubmission open</Badge>}</div></td>
                    <td className="px-5 py-4 font-semibold">{item.score == null ? "—" : `${item.score}/${item.max_points}`}</td>
                    <td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => beginGrade(item)} disabled={readOnlyDemo}>{item.status === "graded" ? "Review grade" : "Grade"}</Button><Button size="sm" variant="outline" onClick={() => allowResubmission(item)} disabled={readOnlyDemo || saving || item.resubmission_allowed}><RotateCcw className="mr-2 h-4 w-4" /> {item.resubmission_allowed ? "Resubmission enabled" : "Enable resubmission"}</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={submitAssignment}>
            <DialogHeader><DialogTitle>{editing ? "Edit Assignment" : "New Assignment"}</DialogTitle><DialogDescription>Assignments belong to a specific class so deadlines and submissions stay cohort-specific.</DialogDescription></DialogHeader>
            <div className="grid gap-5 py-5">
              <div className="grid gap-2"><Label>Class</Label><select name="class_id" required defaultValue={editing?.class_id ?? activeClasses[0]?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{activeClasses.map((item) => <option key={item.id} value={item.id}>{item.course_title} — {item.name}</option>)}</select></div>
              <div className="grid gap-2"><Label>Title</Label><Input name="title" required minLength={2} defaultValue={editing?.title ?? ""} /></div>
              <div className="grid gap-2"><Label>Description</Label><textarea name="description" defaultValue={editing?.description ?? ""} rows={3} className="rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid gap-2"><Label>Instructions</Label><textarea name="instructions" defaultValue={editing?.instructions ?? ""} rows={5} className="rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Publish at</Label><Input name="publish_at" type="datetime-local" defaultValue={toLocalInput(editing?.publish_at)} /></div><div className="grid gap-2"><Label>Due at</Label><Input name="due_at" type="datetime-local" defaultValue={toLocalInput(editing?.due_at)} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Maximum points</Label><Input name="max_points" type="number" min="0" step="0.01" defaultValue={editing?.max_points ?? 100} /></div><div className="grid gap-2"><Label>Status</Label><select name="status" defaultValue={editing?.status ?? "draft"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></div></div>
              <label className="flex items-center gap-3 text-sm"><input name="allow_late" type="checkbox" defaultChecked={editing?.allow_late ?? true} /> Allow submissions after the deadline</label>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setAssignmentOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Assignment"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="sm:max-w-2xl">
          {grading && <form onSubmit={submitGrade}>
            <DialogHeader><DialogTitle>Grade Submission</DialogTitle><DialogDescription>{grading.student_name} • {grading.assignment_title}</DialogDescription></DialogHeader>
            <div className="space-y-5 py-5">
              <div className="rounded-md border border-border bg-surface-muted/50 p-4 text-sm">
                {grading.text_content && <p className="whitespace-pre-wrap text-text-secondary">{grading.text_content}</p>}
                <div className="mt-3 flex flex-wrap gap-3">{grading.external_url && <a href={grading.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-primary">Open link <ExternalLink className="h-3.5 w-3.5" /></a>}{grading.file_url && <a href={grading.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-primary">{grading.file_name ?? "Open file"} <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
              </div>
              <div className="grid gap-2"><Label>Score / {grading.max_points}</Label><Input name="score" type="number" min="0" max={grading.max_points} step="0.01" defaultValue={grading.score ?? ""} required /></div>
              <p className="text-xs text-text-muted">Grading locks the submission. If another attempt is needed, use Enable resubmission from the submissions table.</p>
              <div className="grid gap-2"><Label>Feedback</Label><textarea name="feedback" rows={5} defaultValue={grading.feedback ?? ""} className="rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Grade"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
