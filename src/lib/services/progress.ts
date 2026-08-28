import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAdminStudents } from "@/lib/services/students";

export type AdminStudentProgressRecord = {
  student_id: string;
  student_number: string;
  student_name: string;
  programme_name: string | null;
  intake_name: string | null;
  lessons_completed: number;
  recordings_completed: number;
  last_activity_at: string | null;
};

type ProgressAggregate = {
  completed: number;
  lastActivity: string | null;
};

function newest(current: string | null, candidate: string | null | undefined) {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
}

export async function getAdminStudentProgress(): Promise<AdminStudentProgressRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const students = await getAdminStudents();
  if (students.length === 0) return [];

  const [lessonResult, recordingResult] = await Promise.all([
    supabase.from("lesson_progress").select("student_id,completed_at,last_viewed_at"),
    supabase.from("recording_progress").select("student_id,completed_at,last_viewed_at"),
  ]);

  if (lessonResult.error) console.error("Unable to load lesson progress:", lessonResult.error.message);
  if (recordingResult.error) console.error("Unable to load recording progress:", recordingResult.error.message);

  const lessonByStudent = new Map<string, ProgressAggregate>();
  for (const row of lessonResult.data ?? []) {
    const current = lessonByStudent.get(row.student_id) ?? { completed: 0, lastActivity: null };
    if (row.completed_at) current.completed += 1;
    current.lastActivity = newest(current.lastActivity, row.last_viewed_at);
    lessonByStudent.set(row.student_id, current);
  }

  const recordingByStudent = new Map<string, ProgressAggregate>();
  for (const row of recordingResult.data ?? []) {
    const current = recordingByStudent.get(row.student_id) ?? { completed: 0, lastActivity: null };
    if (row.completed_at) current.completed += 1;
    current.lastActivity = newest(current.lastActivity, row.last_viewed_at);
    recordingByStudent.set(row.student_id, current);
  }

  return students
    .map((student) => {
      const lesson = lessonByStudent.get(student.id) ?? { completed: 0, lastActivity: null };
      const recording = recordingByStudent.get(student.id) ?? { completed: 0, lastActivity: null };

      return {
        student_id: student.id,
        student_number: student.student_number,
        student_name: student.full_name,
        programme_name: student.programme_name,
        intake_name: student.intake_name,
        lessons_completed: lesson.completed,
        recordings_completed: recording.completed,
        last_activity_at: newest(lesson.lastActivity, recording.lastActivity),
      } satisfies AdminStudentProgressRecord;
    })
    .sort((a, b) => {
      if (!a.last_activity_at && !b.last_activity_at) return a.student_name.localeCompare(b.student_name);
      if (!a.last_activity_at) return 1;
      if (!b.last_activity_at) return -1;
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    });
}
