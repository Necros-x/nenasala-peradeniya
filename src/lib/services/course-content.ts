import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ContentStatus = "draft" | "published" | "hidden" | "archived";
export type AdminLessonType = "video" | "text" | "document" | "external";

export type AdminLessonRecord = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_type: AdminLessonType;
  position: number;
  content: unknown;
  duration_minutes: number | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type AdminModuleRecord = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  lessons: AdminLessonRecord[];
};

const MODULE_COLUMNS =
  "id,course_id,title,description,position,status,created_at,updated_at" as const;
const LESSON_COLUMNS =
  "id,module_id,title,description,lesson_type,position,content,duration_minutes,status,created_at,updated_at" as const;

export async function getAdminCourseContent(): Promise<AdminModuleRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
    supabase.from("modules").select(MODULE_COLUMNS).order("course_id").order("position"),
    supabase.from("lessons").select(LESSON_COLUMNS).order("module_id").order("position"),
  ]);

  if (moduleError) {
    console.error("Unable to load modules:", moduleError.message);
    return [];
  }
  if (lessonError) {
    console.error("Unable to load lessons:", lessonError.message);
    return [];
  }

  const lessonsByModule = new Map<string, AdminLessonRecord[]>();
  for (const lesson of (lessons ?? []) as AdminLessonRecord[]) {
    const bucket = lessonsByModule.get(lesson.module_id) ?? [];
    bucket.push(lesson);
    lessonsByModule.set(lesson.module_id, bucket);
  }

  return ((modules ?? []) as Omit<AdminModuleRecord, "lessons">[]).map((module) => ({
    ...module,
    lessons: lessonsByModule.get(module.id) ?? [],
  }));
}
