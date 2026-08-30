import "server-only";

import { getCurrentIdentity } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeachingCourse = { id: string; title: string };
export type TeachingClass = {
  id: string;
  name: string;
  course_id: string;
  course_title: string;
  intake_id: string;
  intake_name: string;
  instructor_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};
export type TeachingIntake = {
  id: string;
  name: string;
  programme_id: string;
  course_ids: string[];
};
export type TeachingInstructor = { id: string; full_name: string };
export type TeachingLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  content: Record<string, unknown>;
  duration_minutes: number | null;
  status: string;
  position: number;
};
export type TeachingModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  lessons: TeachingLesson[];
};
export type TeachingLiveSession = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  provider: string | null;
  meeting_reference: string | null;
  join_url: string | null;
  status: string;
};
export type TeachingRecording = {
  id: string;
  course_id: string;
  source_class_id: string | null;
  source_live_session_id: string | null;
  title: string;
  description: string | null;
  provider: string | null;
  playback_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  source_type: string;
  status: string;
  class_ids: string[];
};
export type CourseMaterialRecord = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  material_type: "file" | "link";
  file_kind: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  external_url: string | null;
  is_published: boolean;
  created_at: string;
  view_url: string | null;
  download_url: string | null;
};

export type InstructorTeachingData = {
  actorId: string;
  isSuperAdmin: boolean;
  courses: TeachingCourse[];
  classes: TeachingClass[];
  intakes: TeachingIntake[];
  instructors: TeachingInstructor[];
  modules: TeachingModule[];
  liveSessions: TeachingLiveSession[];
  recordings: TeachingRecording[];
  materials: CourseMaterialRecord[];
};

function one(value: unknown): any {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function signedMaterialUrls(material: any) {
  if (material.material_type !== "file" || !material.file_path) {
    return { view_url: material.external_url ?? null, download_url: material.external_url ?? null };
  }

  try {
    const admin = createAdminClient();
    const [view, download] = await Promise.all([
      admin.storage.from("course-materials").createSignedUrl(material.file_path, 3600),
      admin.storage.from("course-materials").createSignedUrl(material.file_path, 3600, {
        download: material.file_name || true,
      }),
    ]);
    return {
      view_url: view.data?.signedUrl ?? null,
      download_url: download.data?.signedUrl ?? view.data?.signedUrl ?? null,
    };
  } catch {
    return { view_url: null, download_url: null };
  }
}

async function loadMaterials(courseIds: string[], publishedOnly = false): Promise<CourseMaterialRecord[]> {
  if (courseIds.length === 0) return [];
  const admin = createAdminClient();
  let query = admin
    .from("course_materials")
    .select("id,course_id,title,description,material_type,file_kind,file_path,file_name,mime_type,file_size,external_url,is_published,created_at")
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("is_published", true);

  const { data, error } = await query;
  if (error) {
    if ((error as any).code !== "42P01" && (error as any).code !== "PGRST205") {
      console.error("Unable to load course materials:", error.message);
    }
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (row: any) => ({
      ...row,
      file_size: row.file_size == null ? null : Number(row.file_size),
      ...(await signedMaterialUrls(row)),
    }))
  );
}

export async function getInstructorTeachingData(): Promise<InstructorTeachingData | null> {
  const identity = await getCurrentIdentity();
  if (!identity) return null;
  const isSuperAdmin = identity.roles.includes("super_admin");
  if (!isSuperAdmin && !identity.roles.includes("instructor")) return null;

  const admin = createAdminClient();
  let classQuery = admin
    .from("classes")
    .select("id,name,course_id,intake_id,instructor_id,status,start_date,end_date,courses(title),intakes(name,programme_id)")
    .order("start_date", { ascending: false, nullsFirst: false });
  if (!isSuperAdmin) classQuery = classQuery.eq("instructor_id", identity.id);
  const { data: classRows, error: classError } = await classQuery;
  if (classError) console.error("Unable to load editable instructor classes:", classError.message);

  const classes: TeachingClass[] = (classRows ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    course_id: row.course_id,
    course_title: one(row.courses)?.title ?? "Course",
    intake_id: row.intake_id,
    intake_name: one(row.intakes)?.name ?? "Intake",
    instructor_id: row.instructor_id ?? null,
    status: row.status,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
  }));

  let courses: TeachingCourse[] = [];
  if (isSuperAdmin) {
    const { data, error } = await admin.from("courses").select("id,title").neq("status", "archived").order("title");
    if (error) console.error("Unable to load teaching courses:", error.message);
    courses = (data ?? []) as TeachingCourse[];
  } else {
    const courseMap = new Map(classes.map((row) => [row.course_id, row.course_title]));
    courses = [...courseMap].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  }
  const courseIds = courses.map((course) => course.id);
  const classIds = classes.map((classRow) => classRow.id);

  let modules: TeachingModule[] = [];
  if (courseIds.length > 0) {
    const { data: moduleRows, error: moduleError } = await admin
      .from("modules")
      .select("id,course_id,title,description,status,position")
      .in("course_id", courseIds)
      .order("course_id")
      .order("position");
    if (moduleError) console.error("Unable to load editable modules:", moduleError.message);

    const moduleIds = (moduleRows ?? []).map((row: any) => row.id);
    let lessonRows: any[] = [];
    if (moduleIds.length > 0) {
      const { data, error } = await admin
        .from("lessons")
        .select("id,module_id,title,description,lesson_type,content,duration_minutes,status,position")
        .in("module_id", moduleIds)
        .order("module_id")
        .order("position");
      if (error) console.error("Unable to load editable lessons:", error.message);
      lessonRows = data ?? [];
    }

    const byModule = new Map<string, TeachingLesson[]>();
    for (const lesson of lessonRows) {
      const current = byModule.get(lesson.module_id) ?? [];
      current.push({
        id: lesson.id,
        module_id: lesson.module_id,
        title: lesson.title,
        description: lesson.description ?? null,
        lesson_type: lesson.lesson_type,
        content: lesson.content && typeof lesson.content === "object" ? lesson.content : {},
        duration_minutes: lesson.duration_minutes == null ? null : Number(lesson.duration_minutes),
        status: lesson.status,
        position: Number(lesson.position ?? 0),
      });
      byModule.set(lesson.module_id, current);
    }

    modules = (moduleRows ?? []).map((module: any) => ({
      id: module.id,
      course_id: module.course_id,
      title: module.title,
      description: module.description ?? null,
      status: module.status,
      position: Number(module.position ?? 0),
      lessons: byModule.get(module.id) ?? [],
    }));
  }

  const programmeCourseMap = new Map<string, string[]>();
  if (courseIds.length > 0) {
    const { data: links } = await admin
      .from("programme_courses")
      .select("programme_id,course_id")
      .in("course_id", courseIds);
    for (const link of links ?? []) {
      const list = programmeCourseMap.get(link.programme_id) ?? [];
      list.push(link.course_id);
      programmeCourseMap.set(link.programme_id, list);
    }
  }
  const programmeIds = [...programmeCourseMap.keys()];
  let intakes: TeachingIntake[] = [];
  if (programmeIds.length > 0) {
    const { data, error } = await admin
      .from("intakes")
      .select("id,name,programme_id")
      .in("programme_id", programmeIds)
      .order("name");
    if (error) console.error("Unable to load class-creation intakes:", error.message);
    intakes = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      programme_id: row.programme_id,
      course_ids: programmeCourseMap.get(row.programme_id) ?? [],
    }));
  }

  let instructors: TeachingInstructor[] = [];
  if (isSuperAdmin) {
    const { data } = await admin
      .from("instructor_profiles")
      .select("profile_id,profiles(full_name)")
      .order("created_at");
    instructors = (data ?? []).map((row: any) => ({
      id: row.profile_id,
      full_name: one(row.profiles)?.full_name ?? "Instructor",
    }));
  }

  let liveSessions: TeachingLiveSession[] = [];
  if (classIds.length > 0) {
    const { data, error } = await admin
      .from("live_sessions")
      .select("id,class_id,title,description,starts_at,ends_at,provider,meeting_reference,join_url,status")
      .in("class_id", classIds)
      .order("starts_at", { ascending: false });
    if (error) console.error("Unable to load instructor live sessions:", error.message);
    liveSessions = (data ?? []) as TeachingLiveSession[];
  }

  let recordings: TeachingRecording[] = [];
  if (courseIds.length > 0) {
    const { data: recordingRows, error } = await admin
      .from("recordings")
      .select("id,course_id,source_class_id,source_live_session_id,title,description,provider,playback_url,duration_seconds,recorded_at,source_type,status")
      .in("course_id", courseIds)
      .order("recorded_at", { ascending: false, nullsFirst: false });
    if (error) console.error("Unable to load instructor recordings:", error.message);

    const recordingIds = (recordingRows ?? []).map((row: any) => row.id);
    const assignmentMap = new Map<string, string[]>();
    if (recordingIds.length > 0) {
      let assignmentQuery = admin
        .from("class_recordings")
        .select("recording_id,class_id")
        .in("recording_id", recordingIds);
      if (!isSuperAdmin && classIds.length > 0) assignmentQuery = assignmentQuery.in("class_id", classIds);
      const { data: assignmentRows } = await assignmentQuery;
      for (const assignment of assignmentRows ?? []) {
        const list = assignmentMap.get(assignment.recording_id) ?? [];
        list.push(assignment.class_id);
        assignmentMap.set(assignment.recording_id, list);
      }
    }

    recordings = (recordingRows ?? []).map((row: any) => ({
      ...row,
      duration_seconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
      class_ids: assignmentMap.get(row.id) ?? [],
    }));
  }

  const materials = await loadMaterials(courseIds, false);

  return {
    actorId: identity.id,
    isSuperAdmin,
    courses,
    classes,
    intakes,
    instructors,
    modules,
    liveSessions,
    recordings,
    materials,
  };
}

export async function getStudentCourseMaterials(): Promise<{
  courses: TeachingCourse[];
  materials: CourseMaterialRecord[];
}> {
  const identity = await getCurrentIdentity();
  if (!identity?.roles.includes("student")) return { courses: [], materials: [] };

  const admin = createAdminClient();
  const { data: enrollments, error: enrollmentError } = await admin
    .from("enrollments")
    .select("intake_id,status")
    .eq("student_id", identity.id);
  if (enrollmentError) {
    console.error("Unable to load material enrollments:", enrollmentError.message);
    return { courses: [], materials: [] };
  }

  const allowedEnrollmentStatuses = new Set(["active", "paused", "completed"]);
  const intakeIds = [...new Set(
    (enrollments ?? [])
      .filter((row) => allowedEnrollmentStatuses.has(String(row.status)))
      .map((row) => row.intake_id)
  )];
  if (intakeIds.length === 0) return { courses: [], materials: [] };

  const { data: classRows, error: classError } = await admin
    .from("classes")
    .select("course_id,courses(title)")
    .in("intake_id", intakeIds)
    .neq("status", "cancelled");
  if (classError) {
    console.error("Unable to resolve material courses:", classError.message);
    return { courses: [], materials: [] };
  }

  const courseMap = new Map<string, string>();
  for (const row of classRows ?? []) {
    courseMap.set(row.course_id, one((row as any).courses)?.title ?? "Course");
  }
  const courses = [...courseMap].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  const materials = await loadMaterials(courses.map((course) => course.id), true);
  return { courses, materials };
}
