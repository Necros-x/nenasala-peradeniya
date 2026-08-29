import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRealInstructor } from "@/lib/auth/guards";
import { getAdminClasses, type ClassRecord } from "@/lib/services/classes";
import { getAdminStudents, type AdminStudentRecord } from "@/lib/services/students";
import {
  getAdminAssignments,
  getAdminAssignmentSubmissions,
  type AdminAssignmentRecord,
  type AdminSubmissionRecord,
} from "@/lib/services/assignments";
import {
  getAdminQuizzes,
  getAdminQuizAttempts,
  type AdminQuizRecord,
  type AdminQuizAttemptRecord,
} from "@/lib/services/quizzes";
import {
  getAdminLiveSessions,
  getAdminRecordings,
  getAdminRecordingAssignments,
  type LiveSessionRecord,
  type RecordingRecord,
  type RecordingAssignmentRecord,
} from "@/lib/services/media";
import { getAdminStudentProgress, type AdminStudentProgressRecord } from "@/lib/services/progress";

export type InstructorProfileRecord = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  professional_title: string | null;
};

export type InstructorContentCourse = {
  course_id: string;
  course_title: string;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      lesson_type: string;
      position: number;
      duration_minutes: number | null;
    }>;
  }>;
};

export type InstructorAnnouncementRecord = {
  id: string;
  class_id: string;
  class_name: string;
  course_title: string;
  title: string;
  body: string;
  priority: "general" | "course" | "urgent";
  publish_at: string | null;
  created_at: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function instructorId() {
  const identity = await requireRealInstructor();
  return identity?.id ?? null;
}

export async function getCurrentInstructorProfile(): Promise<InstructorProfileRecord | null> {
  const id = await instructorId();
  const supabase = await createClient();
  if (!id || !supabase) return null;

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("profile_id,professional_title,profiles(full_name,email,avatar_url)")
    .eq("profile_id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Unable to load instructor profile:", error.message);
    return null;
  }

  const profile = firstRelation((data as any).profiles as any) as any;
  return {
    id,
    full_name: profile?.full_name ?? "Instructor",
    email: profile?.email ?? null,
    avatar_url: profile?.avatar_url ?? null,
    professional_title: data.professional_title ?? null,
  };
}

export async function getInstructorClasses(): Promise<ClassRecord[]> {
  const id = await instructorId();
  if (!id) return [];
  const classes = await getAdminClasses();
  return classes.filter((row) => row.instructor_id === id);
}

export async function getInstructorStudents(): Promise<AdminStudentRecord[]> {
  const classes = await getInstructorClasses();
  const intakeIds = new Set(classes.map((row) => row.intake_id));
  if (intakeIds.size === 0) return [];
  const students = await getAdminStudents();
  return students.filter((student) => Boolean(student.intake_id && intakeIds.has(student.intake_id)));
}

export async function getInstructorAssignmentsData(): Promise<{
  assignments: AdminAssignmentRecord[];
  submissions: AdminSubmissionRecord[];
}> {
  const classes = await getInstructorClasses();
  const classIds = new Set(classes.map((row) => row.id));
  if (classIds.size === 0) return { assignments: [], submissions: [] };

  const [assignments, submissions] = await Promise.all([
    getAdminAssignments(),
    getAdminAssignmentSubmissions(),
  ]);

  const allowedAssignments = assignments.filter((row) => classIds.has(row.class_id));
  const assignmentIds = new Set(allowedAssignments.map((row) => row.id));
  return {
    assignments: allowedAssignments,
    submissions: submissions.filter((row) => assignmentIds.has(row.assignment_id)),
  };
}

export async function getInstructorQuizzesData(): Promise<{
  quizzes: AdminQuizRecord[];
  attempts: AdminQuizAttemptRecord[];
}> {
  const classes = await getInstructorClasses();
  const classIds = new Set(classes.map((row) => row.id));
  if (classIds.size === 0) return { quizzes: [], attempts: [] };

  const [quizzes, attempts] = await Promise.all([
    getAdminQuizzes(),
    getAdminQuizAttempts(),
  ]);
  const allowedQuizzes = quizzes.filter((row) => classIds.has(row.class_id));
  const quizIds = new Set(allowedQuizzes.map((row) => row.id));
  return {
    quizzes: allowedQuizzes,
    attempts: attempts.filter((row) => quizIds.has(row.quiz_id)),
  };
}

export async function getInstructorProgress(): Promise<AdminStudentProgressRecord[]> {
  const students = await getInstructorStudents();
  const studentIds = new Set(students.map((row) => row.id));
  if (studentIds.size === 0) return [];
  const progress = await getAdminStudentProgress();
  return progress.filter((row) => studentIds.has(row.student_id));
}

export async function getInstructorContent(): Promise<InstructorContentCourse[]> {
  const classes = await getInstructorClasses();
  const courseMap = new Map(classes.map((row) => [row.course_id, row.course_title]));
  const courseIds = [...courseMap.keys()];
  const supabase = await createClient();
  if (!supabase || courseIds.length === 0) return [];

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules")
    .select("id,course_id,title,description,position,status")
    .in("course_id", courseIds)
    .eq("status", "published")
    .order("course_id")
    .order("position");

  if (moduleError) {
    console.error("Unable to load instructor course content:", moduleError.message);
    return [];
  }

  const moduleIds = (moduleRows ?? []).map((row) => row.id);
  let lessonRows: any[] = [];
  if (moduleIds.length > 0) {
    const { data, error } = await supabase
      .from("lessons")
      .select("id,module_id,title,description,lesson_type,position,duration_minutes,status")
      .in("module_id", moduleIds)
      .eq("status", "published")
      .order("module_id")
      .order("position");
    if (error) console.error("Unable to load instructor lessons:", error.message);
    lessonRows = data ?? [];
  }

  const lessonsByModule = new Map<string, any[]>();
  for (const lesson of lessonRows) {
    const current = lessonsByModule.get(lesson.module_id) ?? [];
    current.push(lesson);
    lessonsByModule.set(lesson.module_id, current);
  }

  return courseIds.map((courseId) => ({
    course_id: courseId,
    course_title: courseMap.get(courseId) ?? "Course",
    modules: (moduleRows ?? [])
      .filter((module) => module.course_id === courseId)
      .map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        position: Number(module.position ?? 0),
        lessons: (lessonsByModule.get(module.id) ?? []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? null,
          lesson_type: lesson.lesson_type,
          position: Number(lesson.position ?? 0),
          duration_minutes: lesson.duration_minutes == null ? null : Number(lesson.duration_minutes),
        })),
      })),
  }));
}

export async function getInstructorMediaData(): Promise<{
  sessions: LiveSessionRecord[];
  recordings: RecordingRecord[];
  assignments: RecordingAssignmentRecord[];
}> {
  const classes = await getInstructorClasses();
  const classIds = new Set(classes.map((row) => row.id));
  const courseIds = new Set(classes.map((row) => row.course_id));
  if (classIds.size === 0) return { sessions: [], recordings: [], assignments: [] };

  const [sessions, recordings, assignments] = await Promise.all([
    getAdminLiveSessions(),
    getAdminRecordings(),
    getAdminRecordingAssignments(),
  ]);

  const allowedAssignments = assignments.filter((row) => classIds.has(row.class_id));
  const assignedRecordingIds = new Set(allowedAssignments.map((row) => row.recording_id));

  return {
    sessions: sessions.filter((row) => classIds.has(row.class_id)),
    recordings: recordings.filter(
      (row) =>
        assignedRecordingIds.has(row.id) ||
        Boolean(row.source_class_id && classIds.has(row.source_class_id)) ||
        courseIds.has(row.course_id)
    ),
    assignments: allowedAssignments,
  };
}

export async function getInstructorAnnouncements(): Promise<InstructorAnnouncementRecord[]> {
  const id = await instructorId();
  const classes = await getInstructorClasses();
  const classIds = classes.map((row) => row.id);
  if (!id || classIds.length === 0) return [];

  const classMap = new Map(classes.map((row) => [row.id, row]));
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .select("id,class_id,title,body,priority,publish_at,created_at")
    .eq("created_by", id)
    .eq("audience_type", "class")
    .in("class_id", classIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Unable to load instructor announcements:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const classRow = classMap.get(row.class_id as string);
    return {
      id: row.id,
      class_id: row.class_id as string,
      class_name: classRow?.name ?? "Class",
      course_title: classRow?.course_title ?? "Course",
      title: row.title,
      body: row.body,
      priority: row.priority as InstructorAnnouncementRecord["priority"],
      publish_at: row.publish_at ?? null,
      created_at: row.created_at,
    };
  });
}

export async function getInstructorDashboardData() {
  const [profile, classes, students, assignmentData, quizData, media] = await Promise.all([
    getCurrentInstructorProfile(),
    getInstructorClasses(),
    getInstructorStudents(),
    getInstructorAssignmentsData(),
    getInstructorQuizzesData(),
    getInstructorMediaData(),
  ]);

  const now = Date.now();
  const upcomingSessions = media.sessions
    .filter((row) => ["scheduled", "live"].includes(row.status) && new Date(row.starts_at).getTime() >= now - 3_600_000)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 5);

  const pendingSubmissions = assignmentData.submissions.filter((row) =>
    ["submitted", "late"].includes(row.status)
  );

  const completedQuizAttempts = quizData.attempts.filter((row) => row.status === "submitted");

  return {
    profile,
    classes,
    students,
    pendingSubmissions,
    quizzes: quizData.quizzes,
    completedQuizAttempts,
    upcomingSessions,
  };
}
