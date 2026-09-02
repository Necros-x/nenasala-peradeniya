import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminInstructorRecord = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "suspended";
  professional_title: string | null;
  bio: string | null;
  qualifications: string[];
  expertise: string[];
  is_public: boolean;
  created_at: string;
  assigned_classes: Array<{
    id: string;
    name: string;
    status: string;
    course_title: string;
    intake_name: string;
  }>;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAdminInstructors(): Promise<AdminInstructorRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [profilesResult, classesResult] = await Promise.all([
    supabase
      .from("instructor_profiles")
      .select("profile_id,professional_title,bio,qualifications,expertise,is_public,created_at,profiles(full_name,email,phone,status)")
      .order("created_at", { ascending: false }),
    supabase
      .from("classes")
      .select("id,instructor_id,name,status,courses(title),intakes(name)")
      .not("instructor_id", "is", null)
      .order("start_date", { ascending: false, nullsFirst: false }),
  ]);

  if (profilesResult.error) {
    console.error("Unable to load instructors:", profilesResult.error.message);
    return [];
  }
  if (classesResult.error) {
    console.error("Unable to load instructor class assignments:", classesResult.error.message);
  }

  const classesByInstructor = new Map<string, AdminInstructorRecord["assigned_classes"]>();
  for (const row of classesResult.data ?? []) {
    if (!row.instructor_id) continue;
    const course = firstRelation((row as any).courses as any) as any;
    const intake = firstRelation((row as any).intakes as any) as any;
    const current = classesByInstructor.get(row.instructor_id) ?? [];
    current.push({
      id: row.id,
      name: row.name,
      status: row.status,
      course_title: course?.title ?? "Course",
      intake_name: intake?.name ?? "Intake",
    });
    classesByInstructor.set(row.instructor_id, current);
  }

  return (profilesResult.data ?? []).map((row: any) => {
    const profile = firstRelation(row.profiles as any) as any;
    return {
      id: row.profile_id,
      full_name: profile?.full_name ?? "Lecturer",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      status: profile?.status ?? "active",
      professional_title: row.professional_title ?? null,
      bio: row.bio ?? null,
      qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
      expertise: Array.isArray(row.expertise) ? row.expertise : [],
      is_public: Boolean(row.is_public),
      created_at: row.created_at,
      assigned_classes: classesByInstructor.get(row.profile_id) ?? [],
    } satisfies AdminInstructorRecord;
  });
}
