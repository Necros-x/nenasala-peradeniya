import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ProgrammeStatus = "draft" | "published" | "archived";

export type ProgrammeRecord = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_text: string | null;
  status: ProgrammeStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  course_ids: string[];
};

const PROGRAMME_COLUMNS =
  "id,name,slug,short_description,description,thumbnail_url,duration_text,status,is_featured,created_at,updated_at" as const;

export async function getAdminProgrammes(): Promise<ProgrammeRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data: programmes, error }, { data: links, error: linkError }] = await Promise.all([
    supabase.from("programmes").select(PROGRAMME_COLUMNS).order("updated_at", { ascending: false }),
    supabase.from("programme_courses").select("programme_id,course_id"),
  ]);

  if (error || linkError) {
    console.error("Unable to load programmes:", error?.message ?? linkError?.message);
    return [];
  }

  const courseIds = new Map<string, string[]>();
  for (const link of links ?? []) {
    const current = courseIds.get(link.programme_id) ?? [];
    current.push(link.course_id);
    courseIds.set(link.programme_id, current);
  }

  return (programmes ?? []).map((programme) => ({
    ...programme,
    course_ids: courseIds.get(programme.id) ?? [],
  })) as ProgrammeRecord[];
}

export async function getPublishedProgrammes(): Promise<ProgrammeRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("programmes")
    .select(PROGRAMME_COLUMNS)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) {
    console.error("Unable to load public programmes:", error.message);
    return [];
  }

  return (data ?? []).map((programme) => ({ ...programme, course_ids: [] })) as ProgrammeRecord[];
}
