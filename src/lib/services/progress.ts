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
  assignments_submitted: number;
  assignments_graded: number;
  assignment_average: number | null;
  quiz_attempts: number;
  quizzes_passed: number;
  quiz_average: number | null;
  last_activity_at: string | null;
};

type ProgressAggregate = {
  completed: number;
  lastActivity: string | null;
};

type AssessmentAggregate = {
  submitted: number;
  completed: number;
  passed: number;
  scoreTotal: number;
  scoreCount: number;
  lastActivity: string | null;
};

function newest(current: string | null, candidate: string | null | undefined) {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function blankAssessment(): AssessmentAggregate {
  return { submitted: 0, completed: 0, passed: 0, scoreTotal: 0, scoreCount: 0, lastActivity: null };
}

export async function getAdminStudentProgress(): Promise<AdminStudentProgressRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const students = await getAdminStudents();
  if (students.length === 0) return [];

  const [lessonResult, recordingResult, assignmentResult, quizResult] = await Promise.all([
    supabase.from("lesson_progress").select("student_id,completed_at,last_viewed_at"),
    supabase.from("recording_progress").select("student_id,completed_at,last_viewed_at"),
    supabase
      .from("assignment_submissions")
      .select("student_id,status,score,submitted_at,graded_at,assignments(max_points)"),
    supabase
      .from("quiz_attempts")
      .select("student_id,status,percentage,passed,started_at,submitted_at"),
  ]);

  if (lessonResult.error) console.error("Unable to load lesson progress:", lessonResult.error.message);
  if (recordingResult.error) console.error("Unable to load recording progress:", recordingResult.error.message);
  if (assignmentResult.error) console.error("Unable to load assignment progress:", assignmentResult.error.message);
  if (quizResult.error) console.error("Unable to load quiz progress:", quizResult.error.message);

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

  const assignmentByStudent = new Map<string, AssessmentAggregate>();
  for (const row of assignmentResult.data ?? []) {
    const current = assignmentByStudent.get(row.student_id) ?? blankAssessment();
    if (row.submitted_at) current.submitted += 1;
    if (row.status === "graded") {
      current.completed += 1;
      const assignment = firstRelation((row as any).assignments as any) as any;
      const maxPoints = numeric(assignment?.max_points);
      if (row.score != null && maxPoints > 0) {
        current.scoreTotal += (numeric(row.score) / maxPoints) * 100;
        current.scoreCount += 1;
      }
    }
    current.lastActivity = newest(current.lastActivity, row.submitted_at);
    current.lastActivity = newest(current.lastActivity, row.graded_at);
    assignmentByStudent.set(row.student_id, current);
  }

  const quizByStudent = new Map<string, AssessmentAggregate>();
  for (const row of quizResult.data ?? []) {
    const current = quizByStudent.get(row.student_id) ?? blankAssessment();
    if (row.status === "submitted" && row.submitted_at) {
      current.submitted += 1;
      current.completed += 1;
      if (row.passed) current.passed += 1;
      if (row.percentage != null) {
        current.scoreTotal += numeric(row.percentage);
        current.scoreCount += 1;
      }
    }
    current.lastActivity = newest(current.lastActivity, row.started_at);
    current.lastActivity = newest(current.lastActivity, row.submitted_at);
    quizByStudent.set(row.student_id, current);
  }

  return students
    .map((student) => {
      const lesson = lessonByStudent.get(student.id) ?? { completed: 0, lastActivity: null };
      const recording = recordingByStudent.get(student.id) ?? { completed: 0, lastActivity: null };
      const assignment = assignmentByStudent.get(student.id) ?? blankAssessment();
      const quiz = quizByStudent.get(student.id) ?? blankAssessment();
      const lastActivity = newest(
        newest(lesson.lastActivity, recording.lastActivity),
        newest(assignment.lastActivity, quiz.lastActivity)
      );

      return {
        student_id: student.id,
        student_number: student.student_number,
        student_name: student.full_name,
        programme_name: student.programme_name,
        intake_name: student.intake_name,
        lessons_completed: lesson.completed,
        recordings_completed: recording.completed,
        assignments_submitted: assignment.submitted,
        assignments_graded: assignment.completed,
        assignment_average: assignment.scoreCount > 0 ? Math.round(assignment.scoreTotal / assignment.scoreCount) : null,
        quiz_attempts: quiz.completed,
        quizzes_passed: quiz.passed,
        quiz_average: quiz.scoreCount > 0 ? Math.round(quiz.scoreTotal / quiz.scoreCount) : null,
        last_activity_at: lastActivity,
      } satisfies AdminStudentProgressRecord;
    })
    .sort((a, b) => {
      if (!a.last_activity_at && !b.last_activity_at) return a.student_name.localeCompare(b.student_name);
      if (!a.last_activity_at) return 1;
      if (!b.last_activity_at) return -1;
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    });
}
