import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LiveSessionStatus = "scheduled" | "live" | "completed" | "cancelled";
export type RecordingSourceType = "live_session" | "uploaded" | "legacy" | "external";
export type RecordingStatus = "draft" | "processing" | "published" | "archived";

export type LiveSessionRecord = {
  id: string;
  class_id: string;
  instructor_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  provider: string | null;
  meeting_reference: string | null;
  join_url: string | null;
  status: LiveSessionStatus;
  created_at: string;
  updated_at: string;
};

export type RecordingRecord = {
  id: string;
  course_id: string;
  source_class_id: string | null;
  source_live_session_id: string | null;
  title: string;
  description: string | null;
  provider: string | null;
  provider_asset_id: string | null;
  playback_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  source_type: RecordingSourceType;
  status: RecordingStatus;
  created_at: string;
  updated_at: string;
};

export type RecordingAssignmentRecord = {
  class_id: string;
  recording_id: string;
  lesson_id: string | null;
  position: number;
  available_from: string | null;
  available_until: string | null;
  is_required: boolean;
  created_at: string;
};

const LIVE_SESSION_COLUMNS =
  "id,class_id,instructor_id,title,description,starts_at,ends_at,provider,meeting_reference,join_url,status,created_at,updated_at" as const;

const RECORDING_COLUMNS =
  "id,course_id,source_class_id,source_live_session_id,title,description,provider,provider_asset_id,playback_url,duration_seconds,recorded_at,source_type,status,created_at,updated_at" as const;

const ASSIGNMENT_COLUMNS =
  "class_id,recording_id,lesson_id,position,available_from,available_until,is_required,created_at" as const;

export async function getAdminLiveSessions(): Promise<LiveSessionRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("live_sessions")
    .select(LIVE_SESSION_COLUMNS)
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("Unable to load live sessions:", error.message);
    return [];
  }

  return (data ?? []) as LiveSessionRecord[];
}

export async function getAdminRecordings(): Promise<RecordingRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("recordings")
    .select(RECORDING_COLUMNS)
    .order("recorded_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load recordings:", error.message);
    return [];
  }

  return (data ?? []) as RecordingRecord[];
}

export async function getAdminRecordingAssignments(): Promise<RecordingAssignmentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("class_recordings")
    .select(ASSIGNMENT_COLUMNS)
    .order("position", { ascending: true });

  if (error) {
    console.error("Unable to load recording assignments:", error.message);
    return [];
  }

  return (data ?? []) as RecordingAssignmentRecord[];
}
