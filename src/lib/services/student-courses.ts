import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/features/student/types";

const STUDENT_CLASS_COLUMNS =
  "id,name,status,course_id,courses(id,title,description,thumbnail_url,category),instructor_profiles(profile_id,profiles(full_name))" as const;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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
  return courses.find((course) => course.id === courseId) ?? null;
}
