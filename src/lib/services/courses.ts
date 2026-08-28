import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course as PublicCourse } from "@/features/public/types";

export type CourseStatus = "draft" | "published" | "archived";

export type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  level: string | null;
  duration_text: string | null;
  status: CourseStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

// Keep this as a string literal. Supabase's select parser uses the literal
// to infer the returned row shape; building it with .join() widens it to
// `string` and TypeScript falls back to GenericStringError.
const COURSE_COLUMNS =
  "id,title,slug,short_description,description,thumbnail_url,category,level,duration_text,status,is_public,created_at,updated_at" as const;

export async function getAdminCourses(): Promise<CourseRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Unable to load admin courses:", error.message);
    return [];
  }

  return (data ?? []) as CourseRecord[];
}

export async function getPublicCourses(limit?: number): Promise<PublicCourse[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("status", "published")
    .eq("is_public", true)
    .order("title", { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("Unable to load public courses:", error.message);
    return [];
  }

  return ((data ?? []) as CourseRecord[]).map(mapCourseToPublic);
}

export async function getPublicCourseBySlug(slug: string): Promise<PublicCourse | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to load public course:", error.message);
    return null;
  }

  return data ? mapCourseToPublic(data as CourseRecord) : null;
}

export function mapCourseToPublic(course: CourseRecord): PublicCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? "",
    shortDescription: course.short_description ?? "",
    thumbnail: course.thumbnail_url ?? undefined,
    category: course.category ?? "General",
    duration: course.duration_text ?? undefined,
    level: course.level ?? undefined,
  };
}
