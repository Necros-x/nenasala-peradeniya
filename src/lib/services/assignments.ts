import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/features/student/types";

export type AssignmentStatus = "draft" | "published" | "closed" | "archived";
export type SubmissionStatus = "draft" | "submitted" | "late" | "graded" | "returned";

export type AdminAssignmentRecord = {
  id: string;
  class_id: string;
  class_name: string;
  course_title: string;
  intake_name: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_at: string | null;
  publish_at: string | null;
  max_points: number;
  allow_late: boolean;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
};

export type AdminSubmissionRecord = {
  id: string;
  assignment_id: string;
  assignment_title: string;
  max_points: number;
  class_name: string;
  course_title: string;
  student_id: string;
  student_number: string;
  student_name: string;
  student_email: string | null;
  text_content: string | null;
  external_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_url: string | null;
  submitted_at: string | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  resubmission_allowed: boolean;
  resubmission_allowed_at: string | null;
  resubmission_count: number;
};

export type StudentAssignmentRecord = {
  id: string;
  class_id: string;
  class_name: string;
  course_title: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_at: string | null;
  publish_at: string | null;
  max_points: number;
  allow_late: boolean;
  status: AssignmentStatus;
  submission: {
    id: string;
    text_content: string | null;
    external_url: string | null;
    file_name: string | null;
    file_size: number | null;
    file_url: string | null;
    submitted_at: string | null;
    status: SubmissionStatus;
    score: number | null;
    feedback: string | null;
    graded_at: string | null;
    resubmission_allowed: boolean;
    resubmission_allowed_at: string | null;
    resubmission_count: number;
  } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

function assignmentState(assignment: StudentAssignmentRecord): NonNullable<CalendarEvent["assignmentState"]> {
  const submission = assignment.submission;
  if (submission?.status === "graded") return "graded";
  if (submission?.resubmission_allowed) return "resubmission";
  if (submission && ["submitted", "late", "returned"].includes(submission.status)) return "submitted";

  if (!assignment.due_at) return "due";
  const remaining = new Date(assignment.due_at).getTime() - Date.now();
  if (remaining < 0) return "overdue";
  if (remaining <= DUE_SOON_MS) return "due_soon";
  return "due";
}

function formatDueTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

async function syncAssignmentPublicationNotifications(
  studentId: string,
  assignments: StudentAssignmentRecord[]
) {
  if (assignments.length === 0) return;

  try {
    const adminClient = createAdminClient();
    const rows = assignments.map((assignment) => ({
      user_id: studentId,
      title: "New assignment published",
      message: assignment.due_at
        ? `“${assignment.title}” is now available and is due ${new Intl.DateTimeFormat("en-LK", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Colombo",
          }).format(new Date(assignment.due_at))}.`
        : `“${assignment.title}” is now available in ${assignment.course_title}.`,
      type: "assignment",
      link: `/student/assignments/${assignment.id}`,
      source_key: `assignment-published:${assignment.id}`,
    }));

    const { error } = await adminClient
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,source_key", ignoreDuplicates: true });
    if (error) console.error("Unable to sync assignment publication notifications:", error.message);
  } catch (error) {
    console.error("Unable to sync assignment publication notifications:", error);
  }
}

const ADMIN_ASSIGNMENT_COLUMNS =
  "id,class_id,title,description,instructions,due_at,publish_at,max_points,allow_late,status,created_at,updated_at,classes(name,status,course_id,intake_id,courses(title),intakes(name))" as const;

const ADMIN_SUBMISSION_COLUMNS =
  "id,assignment_id,student_id,text_content,external_url,file_path,file_name,file_size,submitted_at,status,score,feedback,graded_at,resubmission_allowed,resubmission_allowed_at,resubmission_count,assignments(title,max_points,class_id,classes(name,courses(title))),student_profiles(student_number,profiles(full_name,email))" as const;

const STUDENT_ASSIGNMENT_COLUMNS =
  "id,class_id,title,description,instructions,due_at,publish_at,max_points,allow_late,status,classes!inner(name,status,course_id,courses(title)),assignment_submissions(id,text_content,external_url,file_path,file_name,file_size,submitted_at,status,score,feedback,graded_at,resubmission_allowed,resubmission_allowed_at,resubmission_count)" as const;

async function signSubmissionFile(path: string | null | undefined) {
  if (!path) return null;
  try {
    const { data, error } = await createAdminClient().storage
      .from("assignment-submissions")
      .createSignedUrl(path, 10 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function getAdminAssignments(): Promise<AdminAssignmentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("assignments")
    .select(ADMIN_ASSIGNMENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load assignments:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const classRow = firstRelation(row.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const intake = firstRelation(classRow?.intakes as any) as any;
    return {
      id: row.id,
      class_id: row.class_id,
      class_name: classRow?.name ?? "Class",
      course_title: course?.title ?? "Course",
      intake_name: intake?.name ?? "Intake",
      title: row.title,
      description: row.description ?? null,
      instructions: row.instructions ?? null,
      due_at: row.due_at ?? null,
      publish_at: row.publish_at ?? null,
      max_points: numeric(row.max_points),
      allow_late: Boolean(row.allow_late),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } satisfies AdminAssignmentRecord;
  });
}

export async function getAdminAssignmentSubmissions(): Promise<AdminSubmissionRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(ADMIN_SUBMISSION_COLUMNS)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Unable to load assignment submissions:", error.message);
    return [];
  }

  return Promise.all((data ?? []).map(async (row: any) => {
    const assignment = firstRelation(row.assignments as any) as any;
    const classRow = firstRelation(assignment?.classes as any) as any;
    const course = firstRelation(classRow?.courses as any) as any;
    const student = firstRelation(row.student_profiles as any) as any;
    const profile = firstRelation(student?.profiles as any) as any;
    return {
      id: row.id,
      assignment_id: row.assignment_id,
      assignment_title: assignment?.title ?? "Assignment",
      max_points: numeric(assignment?.max_points),
      class_name: classRow?.name ?? "Class",
      course_title: course?.title ?? "Course",
      student_id: row.student_id,
      student_number: student?.student_number ?? "—",
      student_name: profile?.full_name ?? "Student",
      student_email: profile?.email ?? null,
      text_content: row.text_content ?? null,
      external_url: row.external_url ?? null,
      file_name: row.file_name ?? null,
      file_size: row.file_size == null ? null : numeric(row.file_size),
      file_url: await signSubmissionFile(row.file_path),
      submitted_at: row.submitted_at ?? null,
      status: row.status,
      score: row.score == null ? null : numeric(row.score),
      feedback: row.feedback ?? null,
      graded_at: row.graded_at ?? null,
      resubmission_allowed: Boolean(row.resubmission_allowed),
      resubmission_allowed_at: row.resubmission_allowed_at ?? null,
      resubmission_count: numeric(row.resubmission_count),
    } satisfies AdminSubmissionRecord;
  }));
}

function mapStudentAssignment(row: any): StudentAssignmentRecord {
  const classRow = firstRelation(row.classes as any) as any;
  const course = firstRelation(classRow?.courses as any) as any;
  const submission = firstRelation(row.assignment_submissions as any) as any;

  return {
    id: row.id,
    class_id: row.class_id,
    class_name: classRow?.name ?? "Class",
    course_title: course?.title ?? "Course",
    title: row.title,
    description: row.description ?? null,
    instructions: row.instructions ?? null,
    due_at: row.due_at ?? null,
    publish_at: row.publish_at ?? null,
    max_points: numeric(row.max_points),
    allow_late: Boolean(row.allow_late),
    status: row.status,
    submission: submission ? {
      id: submission.id,
      text_content: submission.text_content ?? null,
      external_url: submission.external_url ?? null,
      file_name: submission.file_name ?? null,
      file_size: submission.file_size == null ? null : numeric(submission.file_size),
      file_url: null,
      submitted_at: submission.submitted_at ?? null,
      status: submission.status,
      score: submission.score == null ? null : numeric(submission.score),
      feedback: submission.feedback ?? null,
      graded_at: submission.graded_at ?? null,
      resubmission_allowed: Boolean(submission.resubmission_allowed),
      resubmission_allowed_at: submission.resubmission_allowed_at ?? null,
      resubmission_count: numeric(submission.resubmission_count),
    } : null,
  };
}

export async function getCurrentStudentAssignments(): Promise<StudentAssignmentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("assignments")
    .select(STUDENT_ASSIGNMENT_COLUMNS)
    .in("classes.status", ["scheduled", "active", "completed"])
    .in("status", ["published", "closed"])
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Unable to load student assignments:", error.message);
    return [];
  }

  const assignments = (data ?? []).map(mapStudentAssignment);
  await syncAssignmentPublicationNotifications(userData.user.id, assignments);
  return assignments;
}

export async function getCurrentStudentAssignmentEvents(): Promise<CalendarEvent[]> {
  const assignments = await getCurrentStudentAssignments();

  return assignments
    .filter((assignment) => Boolean(assignment.due_at))
    .map((assignment) => ({
      id: `assignment:${assignment.id}`,
      title: assignment.title,
      type: "deadline" as const,
      date: assignment.due_at as string,
      time: `Due ${formatDueTime(assignment.due_at as string)}`,
      courseTitle: assignment.course_title,
      description: assignment.description ?? undefined,
      link: `/student/assignments/${assignment.id}`,
      assignmentState: assignmentState(assignment),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getCurrentStudentAssignment(assignmentId: string): Promise<StudentAssignmentRecord | null> {
  const assignments = await getCurrentStudentAssignments();
  const assignment = assignments.find((item) => item.id === assignmentId) ?? null;
  if (!assignment?.submission) return assignment;

  const supabase = await createClient();
  if (!supabase) return assignment;
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select("file_path")
    .eq("id", assignment.submission.id)
    .maybeSingle();
  if (!error && data?.file_path) {
    assignment.submission.file_url = await signSubmissionFile(data.file_path);
  }
  return assignment;
}
