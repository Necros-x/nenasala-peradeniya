"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Edit2,
  ExternalLink,
  Film,
  Link2,
  Plus,
  Radio,
  UsersRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/admin/components/ui/dialog";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import {
  saveLiveSessionAction,
  saveRecordingAction,
  saveRecordingAssignmentsAction,
} from "@/lib/actions/admin/media";
import type { ClassRecord } from "@/lib/services/classes";
import type { CourseRecord } from "@/lib/services/courses";
import type {
  LiveSessionRecord,
  RecordingAssignmentRecord,
  RecordingRecord,
} from "@/lib/services/media";

type Props = {
  classes: ClassRecord[];
  courses: CourseRecord[];
  sessions: LiveSessionRecord[];
  recordings: RecordingRecord[];
  assignments: RecordingAssignmentRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
};

function sessionVariant(status: LiveSessionRecord["status"]): "info" | "success" | "outline" | "danger" {
  if (status === "live") return "danger";
  if (status === "completed") return "success";
  if (status === "cancelled") return "outline";
  return "info";
}

function recordingVariant(status: RecordingRecord["status"]): "secondary" | "warning" | "success" | "outline" {
  if (status === "published") return "success";
  if (status === "processing") return "warning";
  if (status === "archived") return "outline";
  return "secondary";
}

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
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

function convertDateField(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) return;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) formData.set(key, parsed.toISOString());
}

function durationLabel(seconds: number | null) {
  if (!seconds) return "Duration not set";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

export default function RecordingsManager({
  classes,
  courses,
  sessions,
  recordings,
  assignments,
  accessKey,
  readOnlyDemo,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"sessions" | "recordings">("sessions");
  const [saving, setSaving] = useState(false);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSessionRecord | null>(null);

  const [recordingOpen, setRecordingOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<RecordingRecord | null>(null);
  const [recordingCourseId, setRecordingCourseId] = useState("");
  const [sourceType, setSourceType] = useState<RecordingRecord["source_type"]>("external");

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentRecording, setAssignmentRecording] = useState<RecordingRecord | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [assignmentFrom, setAssignmentFrom] = useState("");
  const [assignmentUntil, setAssignmentUntil] = useState("");
  const [assignmentRequired, setAssignmentRequired] = useState(false);

  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const courseById = useMemo(() => new Map(courses.map((item) => [item.id, item])), [courses]);

  const recordingSourceClasses = classes.filter((item) => item.course_id === recordingCourseId);
  const recordingSourceSessions = sessions.filter((session) => {
    const classRow = classById.get(session.class_id);
    return classRow?.course_id === recordingCourseId;
  });

  function beginCreateSession() {
    setEditingSession(null);
    setSessionOpen(true);
  }

  function beginEditSession(item: LiveSessionRecord) {
    setEditingSession(item);
    setSessionOpen(true);
  }

  function beginCreateRecording() {
    setEditingRecording(null);
    setRecordingCourseId(courses[0]?.id ?? "");
    setSourceType("external");
    setRecordingOpen(true);
  }

  function beginEditRecording(item: RecordingRecord) {
    setEditingRecording(item);
    setRecordingCourseId(item.course_id);
    setSourceType(item.source_type);
    setRecordingOpen(true);
  }

  function beginAssignments(item: RecordingRecord) {
    const existing = assignments.filter((assignment) => assignment.recording_id === item.id);
    setAssignmentRecording(item);
    setSelectedClassIds(new Set(existing.map((assignment) => assignment.class_id)));
    setAssignmentFrom(toLocalInput(existing[0]?.available_from));
    setAssignmentUntil(toLocalInput(existing[0]?.available_until));
    setAssignmentRequired(existing.some((assignment) => assignment.is_required));
    setAssignmentOpen(true);
  }

  async function submitSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      if (editingSession) formData.set("id", editingSession.id);
      convertDateField(formData, "starts_at");
      convertDateField(formData, "ends_at");

      const result = await saveLiveSessionAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save live session.");

      toast.success(editingSession ? "Live session updated" : "Live session scheduled");
      setSessionOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitRecording(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      formData.set("course_id", recordingCourseId);
      formData.set("source_type", sourceType);
      if (editingRecording) formData.set("id", editingRecording.id);
      convertDateField(formData, "recorded_at");

      const result = await saveRecordingAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save recording.");

      toast.success(editingRecording ? "Recording updated" : "Recording created");
      setRecordingOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignments(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentRecording) return;
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("recording_id", assignmentRecording.id);
      selectedClassIds.forEach((id) => formData.append("class_ids", id));
      formData.set("is_required", assignmentRequired ? "true" : "false");

      if (assignmentFrom) formData.set("available_from", new Date(assignmentFrom).toISOString());
      if (assignmentUntil) formData.set("available_until", new Date(assignmentUntil).toISOString());

      const result = await saveRecordingAssignmentsAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to update assignments.");

      toast.success("Recording assignments updated");
      setAssignmentOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function toggleClass(classId: string) {
    setSelectedClassIds((current) => {
      const next = new Set(current);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Sessions & Recordings</h1>
          <p className="mt-1 text-text-secondary">
            Schedule live classes, keep a reusable recording library and release recordings to specific classes.
          </p>
        </div>

        <Button
          onClick={tab === "sessions" ? beginCreateSession : beginCreateRecording}
          disabled={readOnlyDemo || (tab === "sessions" ? classes.length === 0 : courses.length === 0)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {tab === "sessions" ? "New Live Session" : "New Recording"}
        </Button>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only. Sign in with a real administrator account to manage live sessions and recordings.
        </div>
      )}

      <div className="inline-flex rounded-[var(--radius-sm)] border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "sessions" ? "bg-brand-primary text-[var(--color-static-white)]" : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          Live Sessions
        </button>
        <button
          type="button"
          onClick={() => setTab("recordings")}
          className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "recordings" ? "bg-brand-primary text-[var(--color-static-white)]" : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          Recording Library
        </button>
      </div>

      {tab === "sessions" ? (
        sessions.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <CalendarClock className="mb-4 h-9 w-9 text-brand-primary" />
              <h2 className="text-lg font-semibold text-foreground">No live sessions yet</h2>
              <p className="mt-2 max-w-md text-sm text-text-secondary">
                Schedule a live session for one of your classes. Enrolled students will see it automatically in Schedule.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => {
              const classRow = classById.get(session.class_id);
              const course = classRow ? courseById.get(classRow.course_id) : null;
              return (
                <Card key={session.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
                          {course?.title ?? "Course"}
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-foreground">{session.title}</h2>
                        <p className="mt-1 text-sm text-text-secondary">{classRow?.name ?? "Class"}</p>
                      </div>
                      <Badge variant={sessionVariant(session.status)}>
                        {session.status === "live" ? "LIVE" : session.status}
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-text-secondary">
                      <p className="flex items-center gap-2">
                        {session.status === "live" ? <Radio className="h-4 w-4 text-danger" /> : <Video className="h-4 w-4 text-brand-primary" />}
                        {formatDateTime(session.starts_at)}
                      </p>
                      <p>{session.provider ?? "Provider not set"}</p>
                      {session.join_url && (
                        <a href={session.join_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-primary hover:underline">
                          Open meeting link <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <Button variant="outline" className="mt-5 w-full" onClick={() => beginEditSession(session)} disabled={readOnlyDemo}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit Session
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <Film className="mb-4 h-9 w-9 text-brand-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recording library is empty</h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              Add a recording once, then assign it to any compatible class without duplicating the video.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recordings.map((recording) => {
            const course = courseById.get(recording.course_id);
            const assignedCount = assignments.filter((assignment) => assignment.recording_id === recording.id).length;
            return (
              <Card key={recording.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">{course?.title ?? "Course"}</p>
                      <h2 className="mt-1 text-lg font-bold text-foreground">{recording.title}</h2>
                    </div>
                    <Badge variant={recordingVariant(recording.status)}>{recording.status}</Badge>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-text-secondary">
                    <p>{recording.provider ?? "Provider not set"} · {durationLabel(recording.duration_seconds)}</p>
                    <p>{recording.recorded_at ? `Recorded ${formatDateTime(recording.recorded_at)}` : "Recording date not set"}</p>
                    <p className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-brand-primary" />
                      {assignedCount} {assignedCount === 1 ? "class" : "classes"} assigned
                    </p>
                    {recording.playback_url && (
                      <a href={recording.playback_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-primary hover:underline">
                        Test playback <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => beginEditRecording(recording)} disabled={readOnlyDemo}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" onClick={() => beginAssignments(recording)} disabled={readOnlyDemo}>
                      <UsersRound className="mr-2 h-4 w-4" /> Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit live session" : "Schedule live session"}</DialogTitle>
            <DialogDescription>Students enrolled in the selected class will see scheduled/live sessions in their LMS schedule.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitSession} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="session-class">Class</Label>
              <select
                id="session-class"
                name="class_id"
                required
                defaultValue={editingSession?.class_id ?? ""}
                className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.course_title} — {item.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-title">Title</Label>
              <Input id="session-title" name="title" required defaultValue={editingSession?.title ?? ""} placeholder="e.g. CCNA Live Class 04" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-description">Description</Label>
              <textarea
                id="session-description"
                name="description"
                defaultValue={editingSession?.description ?? ""}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-start">Starts</Label>
                <Input id="session-start" name="starts_at" type="datetime-local" required defaultValue={toLocalInput(editingSession?.starts_at)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-end">Ends</Label>
                <Input id="session-end" name="ends_at" type="datetime-local" defaultValue={toLocalInput(editingSession?.ends_at)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-provider">Provider</Label>
                <Input id="session-provider" name="provider" defaultValue={editingSession?.provider ?? ""} placeholder="Google Meet / Zoom / Teams" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-reference">Meeting reference</Label>
                <Input id="session-reference" name="meeting_reference" defaultValue={editingSession?.meeting_reference ?? ""} placeholder="Optional meeting ID" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-url">Join URL</Label>
              <Input id="session-url" name="join_url" type="url" defaultValue={editingSession?.join_url ?? ""} placeholder="https://meet.google.com/..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-status">Status</Label>
              <select
                id="session-status"
                name="status"
                defaultValue={editingSession?.status ?? "scheduled"}
                className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingSession ? "Save Changes" : "Schedule Session"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={recordingOpen} onOpenChange={setRecordingOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>{editingRecording ? "Edit recording" : "Add recording"}</DialogTitle>
            <DialogDescription>The playback asset is stored once and can then be assigned to multiple classes.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitRecording} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="recording-course">Course</Label>
              <select
                id="recording-course"
                required
                value={recordingCourseId}
                onChange={(event) => setRecordingCourseId(event.target.value)}
                className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recording-source-type">Source</Label>
                <select
                  id="recording-source-type"
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as RecordingRecord["source_type"])}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="live_session">Live session</option>
                  <option value="uploaded">Hosted upload</option>
                  <option value="legacy">Legacy recording</option>
                  <option value="external">External video</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recording-status">Status</Label>
                <select
                  id="recording-status"
                  name="status"
                  defaultValue={editingRecording?.status ?? "draft"}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="draft">Draft</option>
                  <option value="processing">Processing</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-title">Title</Label>
              <Input id="recording-title" name="title" required defaultValue={editingRecording?.title ?? ""} placeholder="e.g. Networking Fundamentals — Session 01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-description">Description</Label>
              <textarea
                id="recording-description"
                name="description"
                defaultValue={editingRecording?.description ?? ""}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recording-provider">Provider</Label>
                <Input id="recording-provider" name="provider" defaultValue={editingRecording?.provider ?? ""} placeholder="YouTube / Vimeo / Mux / Cloudflare" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recording-asset">Provider asset ID</Label>
                <Input id="recording-asset" name="provider_asset_id" defaultValue={editingRecording?.provider_asset_id ?? ""} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-playback">Playback URL</Label>
              <Input id="recording-playback" name="playback_url" type="url" defaultValue={editingRecording?.playback_url ?? ""} placeholder="https://..." />
              <p className="text-xs text-text-muted">YouTube, Vimeo and direct MP4/WebM URLs play inside the student portal. Other URLs open securely in a new tab.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recording-duration">Duration (minutes)</Label>
                <Input
                  id="recording-duration"
                  name="duration_minutes"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingRecording?.duration_seconds ? Math.round(editingRecording.duration_seconds / 60) : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recording-date">Recorded at</Label>
                <Input id="recording-date" name="recorded_at" type="datetime-local" defaultValue={toLocalInput(editingRecording?.recorded_at)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recording-source-class">Source class</Label>
                <select
                  id="recording-source-class"
                  name="source_class_id"
                  defaultValue={editingRecording?.source_class_id ?? ""}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="">None</option>
                  {recordingSourceClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recording-source-session">Source live session</Label>
                <select
                  id="recording-source-session"
                  name="source_live_session_id"
                  required={sourceType === "live_session"}
                  defaultValue={editingRecording?.source_live_session_id ?? ""}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="">None</option>
                  {recordingSourceSessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRecordingOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !recordingCourseId}>{saving ? "Saving..." : editingRecording ? "Save Changes" : "Create Recording"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>Assign recording to classes</DialogTitle>
            <DialogDescription>
              {assignmentRecording?.title}. Only classes using the same course can receive this recording.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitAssignments} className="space-y-5">
            <div className="space-y-2">
              <Label>Classes</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-[var(--radius-sm)] border border-border p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {classes.filter((item) => item.course_id === assignmentRecording?.course_id).length === 0 ? (
                  <p className="p-3 text-sm text-text-muted">No classes exist for this course yet.</p>
                ) : (
                  classes
                    .filter((item) => item.course_id === assignmentRecording?.course_id)
                    .map((item) => {
                      const selected = selectedClassIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleClass(item.id)}
                          className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-3 text-left transition-colors ${
                            selected ? "border-brand-primary bg-[var(--color-primary-soft)]" : "border-border hover:bg-surface-muted"
                          }`}
                        >
                          <span className={`grid h-5 w-5 place-items-center rounded border ${selected ? "border-brand-primary bg-brand-primary text-white" : "border-border"}`}>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                            <span className="text-xs text-text-muted">{item.intake_name}</span>
                          </span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignment-from">Available from</Label>
                <Input id="assignment-from" type="datetime-local" value={assignmentFrom} onChange={(event) => setAssignmentFrom(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-until">Available until</Label>
                <Input id="assignment-until" type="datetime-local" value={assignmentUntil} onChange={(event) => setAssignmentUntil(event.target.value)} />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border p-4">
              <input type="checkbox" checked={assignmentRequired} onChange={(event) => setAssignmentRequired(event.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
              <span>
                <span className="block text-sm font-semibold text-foreground">Required recording</span>
                <span className="text-xs text-text-muted">Marks this recording as required learning for the assigned classes.</span>
              </span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignmentOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Assignments"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
