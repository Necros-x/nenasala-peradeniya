import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClassStatus = "draft" | "scheduled" | "active" | "completed" | "cancelled";

export type ClassRecord = {
  id: string;
  intake_id: string;
  course_id: string;
  instructor_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
  intake_name: string;
  programme_id: string;
  programme_name: string;
  course_title: string;
  instructor_name: string | null;
};

export type InstructorOption = {
  id: string;
  name: string;
};

const CLASS_COLUMNS =
  "id,intake_id,course_id,instructor_id,name,start_date,end_date,status,created_at,updated_at,intakes(name,programme_id,programmes(name)),courses(title),instructor_profiles(profile_id,profiles(full_name))" as const;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAdminClasses(): Promise<ClassRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("classes")
    .select(CLASS_COLUMNS)
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Unable to load classes:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const intake = firstRelation(row.intakes as any) as any;
    const programme = firstRelation(intake?.programmes as any) as any;
    const course = firstRelation(row.courses as any) as any;
    const instructor = firstRelation(row.instructor_profiles as any) as any;
    const profile = firstRelation(instructor?.profiles as any) as any;

    return {
      id: row.id,
      intake_id: row.intake_id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
      name: row.name,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      intake_name: intake?.name ?? "Intake",
      programme_id: intake?.programme_id ?? "",
      programme_name: programme?.name ?? "Programme",
      course_title: course?.title ?? "Course",
      instructor_name: profile?.full_name ?? null,
    } satisfies ClassRecord;
  });
}

export async function getAdminInstructorOptions(): Promise<InstructorOption[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("profile_id,profiles(full_name)")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load instructor options:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const profile = firstRelation(row.profiles as any) as any;
    return {
      id: row.profile_id,
      name: profile?.full_name ?? "Lecturer",
    };
  });
}
