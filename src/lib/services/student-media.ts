import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CourseRecording, RecordingPlayerType } from "@/features/student/types";

const STUDENT_LIVE_SESSION_COLUMNS =
  "id,class_id,title,description,starts_at,ends_at,provider,join_url,status,classes!inner(id,name,status,course_id,courses(title))" as const;

const STUDENT_RECORDING_COLUMNS =
  "class_id,recording_id,position,is_required,available_from,available_until,classes!inner(id,name,status,course_id,courses(title)),recordings!inner(id,course_id,title,description,provider,playback_url,duration_seconds,recorded_at,status)" as const;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function safeHttpUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function recordingPlayer(raw: unknown): { playerType: RecordingPlayerType; playerUrl?: string } {
  const playback = safeHttpUrl(raw);
  if (!playback) return { playerType: "external" };

  try {
    const url = new URL(playback);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id
        ? { playerType: "embed", playerUrl: `https://www.youtube-nocookie.com/embed/${id}` }
        : { playerType: "external", playerUrl: playback };
    }

    if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return { playerType: "embed", playerUrl: playback };
      const id =
        url.searchParams.get("v") ||
        (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null);
      return id
        ? { playerType: "embed", playerUrl: `https://www.youtube-nocookie.com/embed/${id}` }
        : { playerType: "external", playerUrl: playback };
    }

    if (host.includes("vimeo.com")) {
      if (host === "player.vimeo.com") return { playerType: "embed", playerUrl: playback };
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id
        ? { playerType: "embed", playerUrl: `https://player.vimeo.com/video/${id}` }
        : { playerType: "external", playerUrl: playback };
    }

    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
      return { playerType: "video", playerUrl: playback };
    }

    return { playerType: "external", playerUrl: playback };
  } catch {
    return { playerType: "external" };
  }
}

function formatSessionTime(startsAt: string, endsAt: string | null) {
  const formatter = new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  });
  const start = formatter.format(new Date(startsAt));
  if (!endsAt) return start;
  return `${start} – ${formatter.format(new Date(endsAt))}`;
}

function isCurrentlyAvailable(from: string | null, until: string | null) {
  const now = Date.now();
  if (from && new Date(from).getTime() > now) return false;
  if (until && new Date(until).getTime() < now) return false;
  return true;
}

export async function getCurrentStudentSchedule(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("live_sessions")
    .select(STUDENT_LIVE_SESSION_COLUMNS)
    .in("status", ["scheduled", "live"])
    .in("classes.status", ["scheduled", "active", "completed"])
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Unable to load student live sessions:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const classRow = firstRelation(row.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;

    return {
      id: row.id,
      title: row.title,
      type: "live_session",
      date: row.starts_at,
      time: formatSessionTime(row.starts_at, row.ends_at),
      courseTitle: course?.title ?? classRow?.name ?? "Class",
      description: row.description ?? undefined,
      link: safeHttpUrl(row.join_url),
      provider: row.provider ?? undefined,
      status: row.status === "live" ? "live" : "scheduled",
    } satisfies CalendarEvent;
  });
}

export async function getCurrentStudentRecordings(): Promise<CourseRecording[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("class_recordings")
    .select(STUDENT_RECORDING_COLUMNS)
    .in("classes.status", ["scheduled", "active", "completed"])
    .eq("recordings.status", "published")
    .order("position", { ascending: true });

  if (error) {
    console.error("Unable to load student recordings:", error.message);
    return [];
  }

  const recordingIds = (data ?? []).map((row: any) => row.recording_id).filter(Boolean);
  const completedRecordingIds = new Set<string>();

  if (recordingIds.length > 0) {
    const { data: progressRows, error: progressError } = await supabase
      .from("recording_progress")
      .select("recording_id,completed_at")
      .eq("student_id", userData.user.id)
      .in("recording_id", recordingIds);

    if (progressError) {
      console.error("Unable to load recording progress:", progressError.message);
    } else {
      for (const row of progressRows ?? []) {
        if (row.completed_at) completedRecordingIds.add(row.recording_id);
      }
    }
  }

  const byRecording = new Map<string, CourseRecording>();

  for (const row of data ?? []) {
    if (!isCurrentlyAvailable((row as any).available_from ?? null, (row as any).available_until ?? null)) continue;

    const classRow = firstRelation((row as any).classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const recording = firstRelation((row as any).recordings as any) as any;
    if (!recording?.id || byRecording.has(recording.id)) continue;

    const player = recordingPlayer(recording.playback_url);
    byRecording.set(recording.id, {
      id: recording.id,
      courseId: recording.course_id,
      courseTitle: course?.title ?? "Course",
      className: classRow?.name ?? "Class",
      title: recording.title,
      description: recording.description ?? undefined,
      provider: recording.provider ?? undefined,
      durationSeconds: recording.duration_seconds ?? undefined,
      recordedAt: recording.recorded_at ?? undefined,
      required: Boolean((row as any).is_required),
      completed: completedRecordingIds.has(recording.id),
      ...player,
    });
  }

  return [...byRecording.values()];
}

export async function getCurrentStudentRecording(recordingId: string): Promise<CourseRecording | null> {
  const recordings = await getCurrentStudentRecordings();
  return recordings.find((recording) => recording.id === recordingId) ?? null;
}
