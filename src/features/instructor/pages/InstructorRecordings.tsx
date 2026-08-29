import { CalendarClock, ExternalLink, PlayCircle } from "lucide-react";
import type { LiveSessionRecord, RecordingAssignmentRecord, RecordingRecord } from "@/lib/services/media";

function fmt(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function InstructorRecordings({
  sessions,
  recordings,
  assignments,
}: {
  sessions: LiveSessionRecord[];
  recordings: RecordingRecord[];
  assignments: RecordingAssignmentRecord[];
}) {
  const assignedIds = new Set(assignments.map((row) => row.recording_id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Sessions & Recordings</h1>
        <p className="mt-1 text-text-secondary">Read-only media view for your classes. Publishing and library management remain admin-controlled.</p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-text-primary"><CalendarClock className="h-5 w-5 text-brand-primary" /> Live sessions</h2>
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-secondary">No live sessions yet.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-bold text-text-primary">{session.title}</h3><p className="mt-1 text-sm text-text-secondary">{fmt(session.starts_at)}</p></div>
                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold capitalize text-text-secondary">{session.status}</span>
                  </div>
                  {session.join_url && <a href={session.join_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-primary hover:underline"><ExternalLink className="h-4 w-4" /> Open meeting</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-text-primary"><PlayCircle className="h-5 w-5 text-brand-primary" /> Recording library</h2>
        {recordings.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-secondary">No recordings are available yet.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recordings.map((recording) => (
              <div key={recording.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-text-primary">{recording.title}</h3>
                      <p className="mt-1 text-xs text-text-muted">{fmt(recording.recorded_at)} · {recording.provider ?? recording.source_type}</p>
                    </div>
                    {assignedIds.has(recording.id) && <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-brand-primary">Assigned</span>}
                  </div>
                  {recording.description && <p className="mt-3 text-sm text-text-secondary">{recording.description}</p>}
                  {recording.playback_url && <a href={recording.playback_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-primary hover:underline"><PlayCircle className="h-4 w-4" /> Open recording</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
