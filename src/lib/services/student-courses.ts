import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson, Module } from "@/features/student/types";

const STUDENT_CLASS_COLUMNS =
  "id,name,status,course_id,courses(id,title,description,thumbnail_url,category),instructor_profiles(profile_id,profiles(full_name))" as const;
const MODULE_COLUMNS = "id,course_id,title,description,position,status" as const;
const LESSON_COLUMNS = "id,module_id,title,description,lesson_type,position,content,duration_minutes,status" as const;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function objectContent(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function contentString(value: unknown, key: string) {
  const field = objectContent(value)[key];
  return typeof field === "string" ? field : undefined;
}

function toEmbedUrl(raw?: string) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return raw;
      const id = url.searchParams.get("v") || (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : raw;
    }
    if (url.hostname.includes("vimeo.com")) {
      if (url.hostname === "player.vimeo.com") return raw;
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : raw;
    }
    return raw;
  } catch {
    return undefined;
  }
}

function mapLesson(row: any): Lesson {
  const type = row.lesson_type as Lesson["type"];
  const content = row.content;
  const lesson: Lesson = {
    id: row.id,
    title: row.title,
    type,
    description: row.description ?? undefined,
    duration: row.duration_minutes ?? undefined,
    completed: false,
  };

  if (type === "text") lesson.content = contentString(content, "body") ?? "";
  if (type === "video") lesson.videoUrl = toEmbedUrl(contentString(content, "url"));
  if (type === "document") lesson.resourceName = contentString(content, "filename") ?? "Course resource";
  if (type === "external") {
    lesson.externalUrl = contentString(content, "url");
    lesson.externalLabel = contentString(content, "label") ?? "Open resource";
  }
  return lesson;
}

export async function getCurrentStudentCourses(): Promise<Course[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("classes")
    .select(STUDENT_CLASS_COLUMNS)
    .in("status", ["scheduled", "active", "completed"])
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Unable to load student courses:", error.message);
    return [];
  }

  const byCourse = new Map<string, Course>();

  for (const row of data ?? []) {
    const course = firstRelation((row as any).courses as any) as any;
    if (!course?.id || byCourse.has(course.id)) continue;

    const instructor = firstRelation((row as any).instructor_profiles as any) as any;
    const profile = firstRelation(instructor?.profiles as any) as any;

    byCourse.set(course.id, {
      id: course.id,
      title: course.title,
      description: course.description ?? "",
      thumbnail: course.thumbnail_url ?? undefined,
      instructor: {
        id: instructor?.profile_id ?? "unassigned",
        name: profile?.full_name ?? "Instructor to be announced",
      },
      modules: [],
      category: course.category ?? "General",
      totalLessons: 0,
    });
  }

  return [...byCourse.values()];
}

export async function getCurrentStudentCourseById(courseId: string): Promise<Course | null> {
  const courses = await getCurrentStudentCourses();
  const baseCourse = courses.find((course) => course.id === courseId) ?? null;
  if (!baseCourse) return null;

  const supabase = await createClient();
  if (!supabase) return baseCourse;

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules")
    .select(MODULE_COLUMNS)
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("position");

  if (moduleError) {
    console.error("Unable to load student modules:", moduleError.message);
    return baseCourse;
  }

  const moduleIds = (moduleRows ?? []).map((module) => module.id);
  if (moduleIds.length === 0) return baseCourse;

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select(LESSON_COLUMNS)
    .in("module_id", moduleIds)
    .eq("status", "published")
    .order("position");

  if (lessonError) {
    console.error("Unable to load student lessons:", lessonError.message);
    return baseCourse;
  }

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const row of lessonRows ?? []) {
    const bucket = lessonsByModule.get(row.module_id) ?? [];
    bucket.push(mapLesson(row));
    lessonsByModule.set(row.module_id, bucket);
  }

  const modules: Module[] = (moduleRows ?? []).map((module) => ({
    id: module.id,
    title: module.title,
    lessons: lessonsByModule.get(module.id) ?? [],
  }));

  return {
    ...baseCourse,
    modules,
    totalLessons: modules.reduce((total, module) => total + module.lessons.length, 0),
  };
}

export async function getCurrentStudentLesson(courseId: string, lessonId: string): Promise<{ course: Course; lesson: Lesson } | null> {
  const course = await getCurrentStudentCourseById(courseId);
  if (!course) return null;

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId);
  if (!lesson) return null;
  if (lesson.type !== "document") return { course, lesson };

  const supabase = await createClient();
  if (!supabase) return { course, lesson };

  // Fetch the private storage path only after the authenticated student's course
  // access has already been verified above through RLS.
  const { data: lessonRow, error } = await supabase
    .from("lessons")
    .select("content")
    .eq("id", lessonId)
    .maybeSingle();
  if (error || !lessonRow) return { course, lesson };

  const path = contentString(lessonRow.content, "path");
  if (!path) return { course, lesson };

  try {
    const { data, error: signedError } = await createAdminClient().storage
      .from("lesson-resources")
      .createSignedUrl(path, 10 * 60);
    if (!signedError && data?.signedUrl) lesson.resourceUrl = data.signedUrl;
  } catch (signError) {
    console.error("Unable to sign lesson resource:", signError);
  }

  return { course, lesson };
}
