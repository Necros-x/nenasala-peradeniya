"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createClient } from "@/lib/supabase/server";

export type MediaActionState = {
  ok: boolean;
  error?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? value : null;
}

function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validIso(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function adminContext(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) {
    return { error: "Invalid admin route." as const };
  }

  const admin = await requireRealAdmin();
  if (!admin) {
    return {
      error: "Demo/preview mode is read-only. Sign in with a real admin account to save changes." as const,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };

  return { accessKey, admin, supabase };
}

export async function saveLiveSessionAction(formData: FormData): Promise<MediaActionState> {
  const context = await adminContext(formData);
  if ("error" in context) return { ok: false, error: context.error };
  const { accessKey, admin, supabase } = context;

  const id = text(formData, "id");
  const classId = text(formData, "class_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const startsAt = validIso(nullableText(formData, "starts_at"));
  const endsAt = validIso(nullableText(formData, "ends_at"));
  const provider = nullableText(formData, "provider");
  const meetingReference = nullableText(formData, "meeting_reference");
  const rawJoinUrl = nullableText(formData, "join_url");
  const joinUrl = safeHttpUrl(rawJoinUrl);
  const status = text(formData, "status");

  if (!classId || title.length < 2 || !startsAt) {
    return { ok: false, error: "Class, title and start time are required." };
  }
  if (rawJoinUrl && !joinUrl) return { ok: false, error: "Join URL must be a valid http/https URL." };
  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { ok: false, error: "End time must be after the start time." };
  }
  if (!["scheduled", "live", "completed", "cancelled"].includes(status)) {
    return { ok: false, error: "Invalid live-session status." };
  }

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,instructor_id,status")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classRow) return { ok: false, error: "The selected class could not be found." };
  if (classRow.status === "cancelled") return { ok: false, error: "Cannot schedule a session for a cancelled class." };

  const payload = {
    class_id: classId,
    instructor_id: classRow.instructor_id,
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    provider,
    meeting_reference: meetingReference,
    join_url: joinUrl,
    status: status as "scheduled" | "live" | "completed" | "cancelled",
  };

  const query = id
    ? supabase.from("live_sessions").update(payload).eq("id", id).select("id").single()
    : supabase.from("live_sessions").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    console.error("Unable to save live session:", error);
    return { ok: false, error: "Unable to save the live session." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "live_session.updated" : "live_session.created",
    entity_type: "live_session",
    entity_id: data.id,
    metadata: { class_id: classId, status, provider },
  });

  revalidatePath(`/internal/${accessKey}/lms/recordings`);
  revalidatePath("/student/schedule");
  return { ok: true };
}

export async function saveRecordingAction(formData: FormData): Promise<MediaActionState> {
  const context = await adminContext(formData);
  if ("error" in context) return { ok: false, error: context.error };
  const { accessKey, admin, supabase } = context;

  const id = text(formData, "id");
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const description = nullableText(formData, "description");
  const provider = nullableText(formData, "provider");
  const providerAssetId = nullableText(formData, "provider_asset_id");
  const rawPlaybackUrl = nullableText(formData, "playback_url");
  const playbackUrl = safeHttpUrl(rawPlaybackUrl);
  const recordedAt = validIso(nullableText(formData, "recorded_at"));
  const sourceType = text(formData, "source_type");
  const status = text(formData, "status");
  let sourceClassId = nullableText(formData, "source_class_id");
  const sourceLiveSessionId = nullableText(formData, "source_live_session_id");

  const durationMinutesRaw = text(formData, "duration_minutes");
  const durationMinutes = durationMinutesRaw ? Number(durationMinutesRaw) : null;
  const durationSeconds =
    durationMinutes !== null && Number.isFinite(durationMinutes) && durationMinutes >= 0
      ? Math.round(durationMinutes * 60)
      : null;

  if (!courseId || title.length < 2) return { ok: false, error: "Course and title are required." };
  if (rawPlaybackUrl && !playbackUrl) return { ok: false, error: "Playback URL must be a valid http/https URL." };
  if (status === "published" && !playbackUrl) {
    return { ok: false, error: "Published recordings need a playback URL." };
  }
  if (!["live_session", "uploaded", "legacy", "external"].includes(sourceType)) {
    return { ok: false, error: "Invalid recording source." };
  }
  if (!["draft", "processing", "published", "archived"].includes(status)) {
    return { ok: false, error: "Invalid recording status." };
  }
  if (durationMinutesRaw && durationSeconds === null) {
    return { ok: false, error: "Duration must be zero or a positive number." };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError || !course) return { ok: false, error: "The selected course could not be found." };

  if (sourceClassId) {
    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("id,course_id")
      .eq("id", sourceClassId)
      .maybeSingle();
    if (classError || !classRow || classRow.course_id !== courseId) {
      return { ok: false, error: "Source class must belong to the selected course." };
    }
  }

  if (sourceLiveSessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id,class_id")
      .eq("id", sourceLiveSessionId)
      .maybeSingle();
    if (sessionError || !session) return { ok: false, error: "The selected source live session could not be found." };

    const { data: sourceClass, error: sourceClassError } = await supabase
      .from("classes")
      .select("id,course_id")
      .eq("id", session.class_id)
      .maybeSingle();
    if (sourceClassError || !sourceClass || sourceClass.course_id !== courseId) {
      return { ok: false, error: "The source live session belongs to another course." };
    }
    sourceClassId = sourceClass.id;
  }

  if (sourceType === "live_session" && !sourceLiveSessionId) {
    return { ok: false, error: "Choose the live session this recording came from." };
  }

  const payload = {
    course_id: courseId,
    source_class_id: sourceClassId,
    source_live_session_id: sourceLiveSessionId,
    title,
    description,
    provider,
    provider_asset_id: providerAssetId,
    playback_url: playbackUrl,
    duration_seconds: durationSeconds,
    recorded_at: recordedAt,
    source_type: sourceType as "live_session" | "uploaded" | "legacy" | "external",
    status: status as "draft" | "processing" | "published" | "archived",
  };

  const query = id
    ? supabase.from("recordings").update(payload).eq("id", id).select("id").single()
    : supabase.from("recordings").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    console.error("Unable to save recording:", error);
    return { ok: false, error: "Unable to save the recording." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "recording.updated" : "recording.created",
    entity_type: "recording",
    entity_id: data.id,
    metadata: { course_id: courseId, source_type: sourceType, status },
  });

  revalidatePath(`/internal/${accessKey}/lms/recordings`);
  revalidatePath("/student/recordings");
  return { ok: true };
}

export async function saveRecordingAssignmentsAction(formData: FormData): Promise<MediaActionState> {
  const context = await adminContext(formData);
  if ("error" in context) return { ok: false, error: context.error };
  const { accessKey, admin, supabase } = context;

  const recordingId = text(formData, "recording_id");
  const classIds = formData
    .getAll("class_ids")
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());

  const availableFrom = validIso(nullableText(formData, "available_from"));
  const availableUntil = validIso(nullableText(formData, "available_until"));
  const isRequired = text(formData, "is_required") === "true";

  if (!recordingId) return { ok: false, error: "Recording is required." };
  if (availableFrom && availableUntil && new Date(availableUntil).getTime() <= new Date(availableFrom).getTime()) {
    return { ok: false, error: "Availability end must be after availability start." };
  }

  const { data: recording, error: recordingError } = await supabase
    .from("recordings")
    .select("id,course_id")
    .eq("id", recordingId)
    .maybeSingle();
  if (recordingError || !recording) return { ok: false, error: "The recording could not be found." };

  if (classIds.length > 0) {
    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("id,course_id")
      .in("id", classIds);

    if (classError || !classes || classes.length !== classIds.length) {
      return { ok: false, error: "One or more selected classes could not be found." };
    }
    if (classes.some((item) => item.course_id !== recording.course_id)) {
      return { ok: false, error: "Recordings can only be assigned to classes for the same course." };
    }
  }

  const { error: deleteError } = await supabase
    .from("class_recordings")
    .delete()
    .eq("recording_id", recordingId);
  if (deleteError) {
    console.error("Unable to replace recording assignments:", deleteError);
    return { ok: false, error: "Unable to update recording assignments." };
  }

  if (classIds.length > 0) {
    const { error: insertError } = await supabase.from("class_recordings").insert(
      classIds.map((classId, index) => ({
        class_id: classId,
        recording_id: recordingId,
        lesson_id: null,
        position: index,
        available_from: availableFrom,
        available_until: availableUntil,
        is_required: isRequired,
      }))
    );

    if (insertError) {
      console.error("Unable to save recording assignments:", insertError);
      return { ok: false, error: "Assignments were cleared but the new class assignments could not be saved. Please retry." };
    }
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "recording.assignments_updated",
    entity_type: "recording",
    entity_id: recordingId,
    metadata: { class_ids: classIds, available_from: availableFrom, available_until: availableUntil, is_required: isRequired },
  });

  revalidatePath(`/internal/${accessKey}/lms/recordings`);
  revalidatePath("/student/recordings");
  return { ok: true };
}
