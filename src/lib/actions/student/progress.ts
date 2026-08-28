"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StudentProgressActionState = {
  ok: boolean;
  error?: string;
};

async function getAuthenticatedStudent() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, userId: null };

  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("profile_id")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  if (studentError || !student) return { supabase, userId: null };
  return { supabase, userId: data.user.id };
}

export async function completeLessonAction(
  courseId: string,
  lessonId: string
): Promise<StudentProgressActionState> {
  if (!courseId || !lessonId) return { ok: false, error: "Course and lesson are required." };

  const { supabase, userId } = await getAuthenticatedStudent();
  if (!supabase || !userId) return { ok: false, error: "You must be signed in as a student." };

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id,module_id")
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError || !lesson) {
    return { ok: false, error: "This lesson is unavailable or you no longer have access." };
  }

  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("id,course_id")
    .eq("id", lesson.module_id)
    .eq("status", "published")
    .maybeSingle();

  if (moduleError || !module || module.course_id !== courseId) {
    return { ok: false, error: "This lesson does not belong to the selected course." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      student_id: userId,
      lesson_id: lessonId,
      started_at: now,
      last_viewed_at: now,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "student_id,lesson_id" }
  );

  if (error) {
    console.error("Unable to complete lesson:", error.message);
    return { ok: false, error: "Unable to save lesson progress." };
  }

  revalidatePath("/student/courses");
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/lesson/${lessonId}`);
  return { ok: true };
}

export async function completeRecordingAction(
  recordingId: string
): Promise<StudentProgressActionState> {
  if (!recordingId) return { ok: false, error: "Recording is required." };

  const { supabase, userId } = await getAuthenticatedStudent();
  if (!supabase || !userId) return { ok: false, error: "You must be signed in as a student." };

  // RLS on recordings only returns rows assigned to an accessible class and
  // currently inside the assignment's availability window.
  const { data: recording, error: recordingError } = await supabase
    .from("recordings")
    .select("id")
    .eq("id", recordingId)
    .eq("status", "published")
    .maybeSingle();

  if (recordingError || !recording) {
    return { ok: false, error: "This recording is unavailable or you no longer have access." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("recording_progress").upsert(
    {
      student_id: userId,
      recording_id: recordingId,
      started_at: now,
      last_viewed_at: now,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "student_id,recording_id" }
  );

  if (error) {
    console.error("Unable to complete recording:", error.message);
    return { ok: false, error: "Unable to save recording progress." };
  }

  revalidatePath("/student/recordings");
  revalidatePath(`/student/recordings/${recordingId}`);
  return { ok: true };
}
