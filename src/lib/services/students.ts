import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AdminStudentRecord = {
  id: string;
  student_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  profile_status: "active" | "inactive" | "suspended";
  joined_at: string;
  enrollment_id: string | null;
  enrollment_status: "pending" | "active" | "paused" | "completed" | "cancelled" | null;
  enrolled_at: string | null;
  intake_id: string | null;
  intake_name: string | null;
  programme_name: string | null;
};

const STUDENT_COLUMNS =
  "profile_id,student_number,joined_at,profiles(full_name,email,phone,status),enrollments(id,status,enrolled_at,intake_id,intakes(name,programmes(name)))" as const;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAdminStudents(): Promise<AdminStudentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("student_profiles")
    .select(STUDENT_COLUMNS)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Unable to load students:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const profile = firstRelation(row.profiles as any) as any;
    const enrollments = Array.isArray(row.enrollments) ? [...row.enrollments] : [];
    enrollments.sort((a: any, b: any) => String(b.enrolled_at ?? "").localeCompare(String(a.enrolled_at ?? "")));
    const enrollment = enrollments[0] ?? null;
    const intake = firstRelation(enrollment?.intakes as any) as any;
    const programme = firstRelation(intake?.programmes as any) as any;

    return {
      id: row.profile_id,
      student_number: row.student_number,
      full_name: profile?.full_name ?? "Student",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      profile_status: profile?.status ?? "active",
      joined_at: row.joined_at,
      enrollment_id: enrollment?.id ?? null,
      enrollment_status: enrollment?.status ?? null,
      enrolled_at: enrollment?.enrolled_at ?? null,
      intake_id: enrollment?.intake_id ?? null,
      intake_name: intake?.name ?? null,
      programme_name: programme?.name ?? null,
    } satisfies AdminStudentRecord;
  });
}

export type AdminEnrollmentRecord = {
  id: string;
  student_id: string;
  student_number: string;
  student_name: string;
  intake_id: string;
  intake_name: string;
  programme_name: string;
  status: "pending" | "active" | "paused" | "completed" | "cancelled";
  enrolled_at: string;
  completed_at: string | null;
};

const ENROLLMENT_COLUMNS =
  "id,student_id,intake_id,status,enrolled_at,completed_at,student_profiles(student_number,profiles(full_name)),intakes(name,programmes(name))" as const;

export async function getAdminEnrollments(): Promise<AdminEnrollmentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_COLUMNS)
    .order("enrolled_at", { ascending: false });

  if (error) {
    console.error("Unable to load enrollments:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const student = firstRelation(row.student_profiles as any) as any;
    const profile = firstRelation(student?.profiles as any) as any;
    const intake = firstRelation(row.intakes as any) as any;
    const programme = firstRelation(intake?.programmes as any) as any;

    return {
      id: row.id,
      student_id: row.student_id,
      student_number: student?.student_number ?? "—",
      student_name: profile?.full_name ?? "Student",
      intake_id: row.intake_id,
      intake_name: intake?.name ?? "Intake",
      programme_name: programme?.name ?? "Programme",
      status: row.status,
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
    } satisfies AdminEnrollmentRecord;
  });
}
