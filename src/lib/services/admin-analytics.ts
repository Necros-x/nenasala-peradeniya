import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireRealAdmin } from "@/lib/auth/guards";

export type AnalyticsRange = 30 | 90 | 180 | 365;

export type AdminAttentionData = {
  pendingEnrollments: number;
  ungradedSubmissions: number;
  unassignedClasses: number;
  closingIntakes: number;
  scheduledAnnouncements: number;
  total: number;
};

export type AdminAnalyticsData = {
  available: boolean;
  rangeDays: AnalyticsRange;
  generatedAt: string;
  headline: {
    students: number;
    activeLearners: number;
    enrollments: number;
    completionRate: number;
    activeClasses: number;
    publishedCourses: number;
    instructors: number;
    certificatesIssued: number;
  };
  period: {
    newEnrollments: number;
    completedEnrollments: number;
    assignmentSubmissions: number;
    gradedAssignments: number;
    assignmentAverage: number | null;
    quizAttempts: number;
    quizAverage: number | null;
    quizPassRate: number | null;
    lessonCompletions: number;
    recordingCompletions: number;
    engagedLearners: number;
  };
  enrollmentTrend: Array<{ label: string; enrollments: number; completions: number }>;
  enrollmentStatuses: Array<{ status: string; count: number }>;
  programmes: Array<{
    id: string;
    name: string;
    enrollments: number;
    active: number;
    completed: number;
    capacity: number;
    utilisation: number | null;
  }>;
  courses: Array<{
    id: string;
    title: string;
    classes: number;
    learners: number;
    assignmentAverage: number | null;
    quizAverage: number | null;
    quizPassRate: number | null;
  }>;
  instructors: Array<{
    id: string;
    name: string;
    title: string | null;
    classes: number;
    learners: number;
    awaitingGrading: number;
  }>;
  certificates: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    actor: string;
    action: string;
    entityType: string;
    target: string | null;
    createdAt: string;
  }>;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  intake_id: string;
  status: string;
  enrolled_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type IntakeRow = {
  id: string;
  programme_id: string;
  name: string;
  status: string;
  capacity: number | null;
  registration_close_at: string | null;
};

type ProgrammeRow = { id: string; name: string; status: string };
type CourseRow = { id: string; title: string; status: string };

type ClassRow = {
  id: string;
  intake_id: string;
  course_id: string;
  instructor_id: string | null;
  name: string;
  status: string;
};

type AssignmentRow = {
  id: string;
  class_id: string;
  max_points: number | string | null;
  status: string;
};

type AssignmentSubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
  score: number | string | null;
  submitted_at: string | null;
  graded_at: string | null;
};

type QuizRow = { id: string; class_id: string; status: string };

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  status: string;
  percentage: number | string | null;
  passed: boolean | null;
  submitted_at: string | null;
};

type ProgressRow = {
  student_id: string;
  completed_at: string | null;
  last_viewed_at: string | null;
};

type CertificateRow = {
  id: string;
  student_id: string;
  course_id: string | null;
  programme_id: string | null;
  status: string;
  issued_at: string;
};

type InstructorRow = {
  profile_id: string;
  professional_title: string | null;
  profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
};

type AuditRow = {
  id: number | string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function fetchPaged<T>(
  label: string,
  makeQuery: (from: number, to: number) => any,
): Promise<T[]> {
  const rows: T[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await makeQuery(from, to);

    if (error) {
      console.error(`Unable to load analytics ${label}:`, error.message);
      return rows;
    }

    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

async function exactCount(label: string, query: any) {
  const { count, error } = await query;
  if (error) {
    console.error(`Unable to count analytics ${label}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return round((part / total) * 100);
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null);
  if (valid.length === 0) return null;
  return round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function bucketTrend(
  rows: EnrollmentRow[],
  rangeDays: AnalyticsRange,
  cutoff: Date,
  now: Date,
) {
  if (rangeDays <= 90) {
    const bucketDays = rangeDays <= 30 ? 5 : 7;
    const bucketMs = bucketDays * 86_400_000;
    const start = new Date(cutoff);
    start.setHours(0, 0, 0, 0);
    const count = Math.ceil((now.getTime() - start.getTime()) / bucketMs) + 1;
    const points = Array.from({ length: count }, (_, index) => {
      const date = new Date(start.getTime() + index * bucketMs);
      return {
        label: new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short" }).format(date),
        enrollments: 0,
        completions: 0,
      };
    });

    for (const row of rows) {
      const enrolledTime = new Date(row.enrolled_at ?? row.created_at).getTime();
      if (enrolledTime >= start.getTime()) {
        const index = Math.min(
          points.length - 1,
          Math.max(0, Math.floor((enrolledTime - start.getTime()) / bucketMs)),
        );
        points[index].enrollments += 1;
      }

      if (row.completed_at) {
        const completedTime = new Date(row.completed_at).getTime();
        if (completedTime >= start.getTime()) {
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.floor((completedTime - start.getTime()) / bucketMs)),
          );
          points[index].completions += 1;
        }
      }
    }

    return points;
  }

  const startMonth = new Date(cutoff.getFullYear(), cutoff.getMonth(), 1);
  const points: Array<{ key: string; label: string; enrollments: number; completions: number }> = [];
  const cursor = new Date(startMonth);

  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      key,
      label: new Intl.DateTimeFormat("en-LK", {
        month: "short",
        year: rangeDays >= 365 ? "2-digit" : undefined,
      }).format(cursor),
      enrollments: 0,
      completions: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const pointMap = new Map(points.map((point) => [point.key, point]));
  for (const row of rows) {
    const enrolled = new Date(row.enrolled_at ?? row.created_at);
    if (enrolled >= cutoff) {
      const key = `${enrolled.getFullYear()}-${String(enrolled.getMonth() + 1).padStart(2, "0")}`;
      pointMap.get(key)!.enrollments += 1;
    }

    if (row.completed_at) {
      const completed = new Date(row.completed_at);
      if (completed >= cutoff) {
        const key = `${completed.getFullYear()}-${String(completed.getMonth() + 1).padStart(2, "0")}`;
        pointMap.get(key)!.completions += 1;
      }
    }
  }

  return points.map(({ key: _key, ...point }) => point);
}

function metadataTarget(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;
  for (const key of [
    "student_number",
    "email",
    "title",
    "name",
    "course_title",
    "credential_id",
    "order_number",
  ]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function emptyAttention(): AdminAttentionData {
  return {
    pendingEnrollments: 0,
    ungradedSubmissions: 0,
    unassignedClasses: 0,
    closingIntakes: 0,
    scheduledAnnouncements: 0,
    total: 0,
  };
}

function emptyAnalytics(rangeDays: AnalyticsRange): AdminAnalyticsData {
  return {
    available: false,
    rangeDays,
    generatedAt: new Date().toISOString(),
    headline: {
      students: 0,
      activeLearners: 0,
      enrollments: 0,
      completionRate: 0,
      activeClasses: 0,
      publishedCourses: 0,
      instructors: 0,
      certificatesIssued: 0,
    },
    period: {
      newEnrollments: 0,
      completedEnrollments: 0,
      assignmentSubmissions: 0,
      gradedAssignments: 0,
      assignmentAverage: null,
      quizAttempts: 0,
      quizAverage: null,
      quizPassRate: null,
      lessonCompletions: 0,
      recordingCompletions: 0,
      engagedLearners: 0,
    },
    enrollmentTrend: [],
    enrollmentStatuses: [],
    programmes: [],
    courses: [],
    instructors: [],
    certificates: [],
    recentActivity: [],
  };
}

export async function getAdminAttentionData(): Promise<AdminAttentionData> {
  const actor = await requireRealAdmin();
  if (!actor) return emptyAttention();

  const supabase = await createClient();
  if (!supabase) return emptyAttention();

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86_400_000);

  const [
    pendingEnrollments,
    ungradedSubmissions,
    unassignedClasses,
    closingIntakes,
    scheduledAnnouncements,
  ] = await Promise.all([
    exactCount(
      "pending enrollments",
      supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ),
    exactCount(
      "ungraded submissions",
      supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).in("status", ["submitted", "late"]),
    ),
    exactCount(
      "unassigned classes",
      supabase.from("classes").select("id", { count: "exact", head: true }).in("status", ["scheduled", "active"]).is("instructor_id", null),
    ),
    exactCount(
      "closing intakes",
      supabase
        .from("intakes")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "closing_soon"])
        .gte("registration_close_at", now.toISOString())
        .lte("registration_close_at", sevenDays.toISOString()),
    ),
    exactCount(
      "scheduled announcements",
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gt("publish_at", now.toISOString()),
    ),
  ]);

  return {
    pendingEnrollments,
    ungradedSubmissions,
    unassignedClasses,
    closingIntakes,
    scheduledAnnouncements,
    total:
      pendingEnrollments +
      ungradedSubmissions +
      unassignedClasses +
      closingIntakes +
      scheduledAnnouncements,
  };
}

export async function getAdminAnalyticsData(
  rangeDays: AnalyticsRange = 90,
): Promise<AdminAnalyticsData> {
  const actor = await requireRealAdmin();
  if (!actor) return emptyAnalytics(rangeDays);

  const supabase = await createClient();
  if (!supabase) return emptyAnalytics(rangeDays);

  const now = new Date();
  const cutoff = new Date(now.getTime() - rangeDays * 86_400_000);
  const cutoffIso = cutoff.toISOString();

  const [
    studentCount,
    instructorCount,
    enrollmentRows,
    intakeRows,
    programmeRows,
    courseRows,
    classRows,
    assignmentRows,
    assignmentSubmissionRows,
    quizRows,
    quizAttemptRows,
    lessonProgressRows,
    recordingProgressRows,
    certificateRows,
    auditRows,
  ] = await Promise.all([
    exactCount("students", supabase.from("student_profiles").select("profile_id", { count: "exact", head: true })),
    exactCount("instructors", supabase.from("instructor_profiles").select("profile_id", { count: "exact", head: true })),
    fetchPaged<EnrollmentRow>("enrollments", (from, to) =>
      supabase.from("enrollments").select("id,student_id,intake_id,status,enrolled_at,completed_at,created_at").order("created_at").range(from, to),
    ),
    fetchPaged<IntakeRow>("intakes", (from, to) =>
      supabase.from("intakes").select("id,programme_id,name,status,capacity,registration_close_at").order("created_at").range(from, to),
    ),
    fetchPaged<ProgrammeRow>("programmes", (from, to) =>
      supabase.from("programmes").select("id,name,status").order("created_at").range(from, to),
    ),
    fetchPaged<CourseRow>("courses", (from, to) =>
      supabase.from("courses").select("id,title,status").order("created_at").range(from, to),
    ),
    fetchPaged<ClassRow>("classes", (from, to) =>
      supabase.from("classes").select("id,intake_id,course_id,instructor_id,name,status").order("created_at").range(from, to),
    ),
    fetchPaged<AssignmentRow>("assignments", (from, to) =>
      supabase.from("assignments").select("id,class_id,max_points,status").order("created_at").range(from, to),
    ),
    fetchPaged<AssignmentSubmissionRow>("assignment submissions", (from, to) =>
      supabase
        .from("assignment_submissions")
        .select("id,assignment_id,student_id,status,score,submitted_at,graded_at")
        .gte("submitted_at", cutoffIso)
        .order("submitted_at")
        .range(from, to),
    ),
    fetchPaged<QuizRow>("quizzes", (from, to) =>
      supabase.from("quizzes").select("id,class_id,status").order("created_at").range(from, to),
    ),
    fetchPaged<QuizAttemptRow>("quiz attempts", (from, to) =>
      supabase
        .from("quiz_attempts")
        .select("id,quiz_id,student_id,status,percentage,passed,submitted_at")
        .gte("submitted_at", cutoffIso)
        .order("submitted_at")
        .range(from, to),
    ),
    fetchPaged<ProgressRow>("lesson progress", (from, to) =>
      supabase
        .from("lesson_progress")
        .select("student_id,completed_at,last_viewed_at")
        .gte("last_viewed_at", cutoffIso)
        .order("last_viewed_at")
        .range(from, to),
    ),
    fetchPaged<ProgressRow>("recording progress", (from, to) =>
      supabase
        .from("recording_progress")
        .select("student_id,completed_at,last_viewed_at")
        .gte("last_viewed_at", cutoffIso)
        .order("last_viewed_at")
        .range(from, to),
    ),
    fetchPaged<CertificateRow>("certificates", (from, to) =>
      supabase.from("certificates").select("id,student_id,course_id,programme_id,status,issued_at").order("issued_at").range(from, to),
    ),
    fetchPaged<AuditRow>("audit logs", (from, to) =>
      supabase.from("audit_logs").select("id,actor_id,action,entity_type,metadata,created_at").order("created_at", { ascending: false }).range(from, Math.min(to, from + 49)),
    ),
  ]);

  const recentAuditRows = auditRows.slice(0, 15);
  const actorIds = [...new Set(recentAuditRows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))];
  const actorNames = new Map<string, string>();

  if (actorIds.length > 0) {
    const { data: actorProfiles, error } = await supabase.from("profiles").select("id,full_name").in("id", actorIds);
    if (error) {
      console.error("Unable to load analytics activity actors:", error.message);
    } else {
      for (const profile of actorProfiles ?? []) actorNames.set(profile.id, profile.full_name ?? "Internal user");
    }
  }

  const { data: instructorProfiles, error: instructorError } = await supabase
    .from("instructor_profiles")
    .select("profile_id,professional_title,profiles(full_name)");

  if (instructorError) console.error("Unable to load analytics instructor names:", instructorError.message);
  const instructorRows = (instructorProfiles ?? []) as InstructorRow[];

  const nonCancelledEnrollments = enrollmentRows.filter((row) => row.status !== "cancelled");
  const activeLearnerIds = new Set(
    enrollmentRows.filter((row) => ["active", "paused"].includes(row.status)).map((row) => row.student_id),
  );
  const completedEnrollmentCount = enrollmentRows.filter((row) => row.status === "completed").length;

  const periodEnrollments = enrollmentRows.filter((row) => new Date(row.enrolled_at ?? row.created_at) >= cutoff);
  const periodCompletedEnrollments = enrollmentRows.filter(
    (row) => row.completed_at && new Date(row.completed_at) >= cutoff,
  );

  const submittedAssignments = assignmentSubmissionRows.filter((row) =>
    ["submitted", "late", "graded"].includes(row.status),
  );
  const gradedAssignments = assignmentSubmissionRows.filter((row) => row.graded_at || row.status === "graded");

  const assignmentById = new Map(assignmentRows.map((row) => [row.id, row]));
  const assignmentPercentages = gradedAssignments.map((submission) => {
    const assignment = assignmentById.get(submission.assignment_id);
    const score = numberValue(submission.score);
    const maxPoints = numberValue(assignment?.max_points);
    if (score == null || maxPoints == null || maxPoints <= 0) return null;
    return round((score / maxPoints) * 100);
  });

  const completedQuizAttempts = quizAttemptRows.filter(
    (row) => row.status === "submitted" && row.submitted_at,
  );
  const quizPercentages = completedQuizAttempts.map((row) => numberValue(row.percentage));
  const passedQuizAttempts = completedQuizAttempts.filter((row) => row.passed === true).length;

  const lessonCompletions = lessonProgressRows.filter(
    (row) => row.completed_at && new Date(row.completed_at) >= cutoff,
  ).length;
  const recordingCompletions = recordingProgressRows.filter(
    (row) => row.completed_at && new Date(row.completed_at) >= cutoff,
  ).length;

  const engagedLearners = new Set<string>();
  for (const row of lessonProgressRows) engagedLearners.add(row.student_id);
  for (const row of recordingProgressRows) engagedLearners.add(row.student_id);
  for (const row of assignmentSubmissionRows) engagedLearners.add(row.student_id);
  for (const row of completedQuizAttempts) engagedLearners.add(row.student_id);

  const enrollmentStatusMap = new Map<string, number>();
  for (const row of enrollmentRows) {
    enrollmentStatusMap.set(row.status, (enrollmentStatusMap.get(row.status) ?? 0) + 1);
  }

  const intakesByProgramme = new Map<string, IntakeRow[]>();
  for (const intake of intakeRows) {
    const current = intakesByProgramme.get(intake.programme_id) ?? [];
    current.push(intake);
    intakesByProgramme.set(intake.programme_id, current);
  }

  const programmeAnalytics = programmeRows
    .map((programme) => {
      const intakes = intakesByProgramme.get(programme.id) ?? [];
      const intakeIds = new Set(intakes.map((intake) => intake.id));
      const rows = enrollmentRows.filter((enrollment) => intakeIds.has(enrollment.intake_id));
      const active = rows.filter((row) => ["active", "paused"].includes(row.status)).length;
      const completed = rows.filter((row) => row.status === "completed").length;
      const capacity = intakes.reduce((sum, intake) => sum + Math.max(0, intake.capacity ?? 0), 0);
      const occupied = rows.filter((row) => row.status !== "cancelled").length;

      return {
        id: programme.id,
        name: programme.name,
        enrollments: rows.length,
        active,
        completed,
        capacity,
        utilisation: capacity > 0 ? percent(occupied, capacity) : null,
      };
    })
    .sort((a, b) => b.enrollments - a.enrollments || a.name.localeCompare(b.name));

  const classIdsByCourse = new Map<string, Set<string>>();
  const intakeIdsByCourse = new Map<string, Set<string>>();
  for (const classRow of classRows) {
    const classSet = classIdsByCourse.get(classRow.course_id) ?? new Set<string>();
    classSet.add(classRow.id);
    classIdsByCourse.set(classRow.course_id, classSet);

    const intakeSet = intakeIdsByCourse.get(classRow.course_id) ?? new Set<string>();
    intakeSet.add(classRow.intake_id);
    intakeIdsByCourse.set(classRow.course_id, intakeSet);
  }

  const assignmentIdsByClass = new Map<string, Set<string>>();
  for (const assignment of assignmentRows) {
    const current = assignmentIdsByClass.get(assignment.class_id) ?? new Set<string>();
    current.add(assignment.id);
    assignmentIdsByClass.set(assignment.class_id, current);
  }

  const quizIdsByClass = new Map<string, Set<string>>();
  for (const quiz of quizRows) {
    const current = quizIdsByClass.get(quiz.class_id) ?? new Set<string>();
    current.add(quiz.id);
    quizIdsByClass.set(quiz.class_id, current);
  }

  const courseAnalytics = courseRows
    .map((course) => {
      const classIds = classIdsByCourse.get(course.id) ?? new Set<string>();
      const intakeIds = intakeIdsByCourse.get(course.id) ?? new Set<string>();
      const learnerIds = new Set(
        enrollmentRows
          .filter((row) => intakeIds.has(row.intake_id) && ["active", "paused", "completed"].includes(row.status))
          .map((row) => row.student_id),
      );

      const assignmentIds = new Set<string>();
      for (const classId of classIds) {
        for (const assignmentId of assignmentIdsByClass.get(classId) ?? []) assignmentIds.add(assignmentId);
      }

      const courseAssignmentScores = gradedAssignments
        .filter((row) => assignmentIds.has(row.assignment_id))
        .map((submission) => {
          const assignment = assignmentById.get(submission.assignment_id);
          const score = numberValue(submission.score);
          const maxPoints = numberValue(assignment?.max_points);
          if (score == null || maxPoints == null || maxPoints <= 0) return null;
          return round((score / maxPoints) * 100);
        });

      const quizIds = new Set<string>();
      for (const classId of classIds) {
        for (const quizId of quizIdsByClass.get(classId) ?? []) quizIds.add(quizId);
      }

      const courseQuizAttempts = completedQuizAttempts.filter((row) => quizIds.has(row.quiz_id));

      return {
        id: course.id,
        title: course.title,
        classes: classIds.size,
        learners: learnerIds.size,
        assignmentAverage: average(courseAssignmentScores),
        quizAverage: average(courseQuizAttempts.map((row) => numberValue(row.percentage))),
        quizPassRate:
          courseQuizAttempts.length > 0
            ? percent(courseQuizAttempts.filter((row) => row.passed).length, courseQuizAttempts.length)
            : null,
      };
    })
    .sort((a, b) => b.learners - a.learners || a.title.localeCompare(b.title));

  const instructorAnalytics = instructorRows
    .map((instructor) => {
      const profile = firstRelation(instructor.profiles);
      const assignedClasses = classRows.filter((classRow) => classRow.instructor_id === instructor.profile_id);
      const classIds = new Set(assignedClasses.map((row) => row.id));
      const intakeIds = new Set(assignedClasses.map((row) => row.intake_id));
      const learnerIds = new Set(
        enrollmentRows
          .filter((row) => intakeIds.has(row.intake_id) && ["active", "paused", "completed"].includes(row.status))
          .map((row) => row.student_id),
      );

      const assignmentIds = new Set(
        assignmentRows.filter((assignment) => classIds.has(assignment.class_id)).map((assignment) => assignment.id),
      );
      const awaitingGrading = assignmentSubmissionRows.filter(
        (submission) => assignmentIds.has(submission.assignment_id) && ["submitted", "late"].includes(submission.status),
      ).length;

      return {
        id: instructor.profile_id,
        name: profile?.full_name ?? "Instructor",
        title: instructor.professional_title,
        classes: assignedClasses.length,
        learners: learnerIds.size,
        awaitingGrading,
      };
    })
    .sort((a, b) => b.classes - a.classes || a.name.localeCompare(b.name));

  const certificateStatusMap = new Map<string, number>();
  for (const certificate of certificateRows) {
    certificateStatusMap.set(certificate.status, (certificateStatusMap.get(certificate.status) ?? 0) + 1);
  }

  return {
    available: true,
    rangeDays,
    generatedAt: new Date().toISOString(),
    headline: {
      students: studentCount,
      activeLearners: activeLearnerIds.size,
      enrollments: nonCancelledEnrollments.length,
      completionRate: percent(completedEnrollmentCount, nonCancelledEnrollments.length),
      activeClasses: classRows.filter((row) => row.status === "active").length,
      publishedCourses: courseRows.filter((row) => row.status === "published").length,
      instructors: instructorCount,
      certificatesIssued: certificateRows.length,
    },
    period: {
      newEnrollments: periodEnrollments.length,
      completedEnrollments: periodCompletedEnrollments.length,
      assignmentSubmissions: submittedAssignments.length,
      gradedAssignments: gradedAssignments.length,
      assignmentAverage: average(assignmentPercentages),
      quizAttempts: completedQuizAttempts.length,
      quizAverage: average(quizPercentages),
      quizPassRate: completedQuizAttempts.length > 0 ? percent(passedQuizAttempts, completedQuizAttempts.length) : null,
      lessonCompletions,
      recordingCompletions,
      engagedLearners: engagedLearners.size,
    },
    enrollmentTrend: bucketTrend(enrollmentRows, rangeDays, cutoff, now),
    enrollmentStatuses: [...enrollmentStatusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    programmes: programmeAnalytics,
    courses: courseAnalytics,
    instructors: instructorAnalytics,
    certificates: [...certificateStatusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    recentActivity: recentAuditRows.map((row) => ({
      id: String(row.id),
      actor: row.actor_id ? actorNames.get(row.actor_id) ?? "Internal user" : "System",
      action: row.action.replace(/[._]/g, " "),
      entityType: row.entity_type.replace(/_/g, " "),
      target: metadataTarget(row.metadata),
      createdAt: row.created_at,
    })),
  };
}
