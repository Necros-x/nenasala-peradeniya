import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccountProfile, AccountRole, StudentAccountProfile, StudentEnrollmentSummary } from "@/lib/types/account";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeRole(value: unknown): AccountRole | null {
  if (value === "student" || value === "instructor" || value === "staff" || value === "admin" || value === "super_admin") {
    return value;
  }
  return null;
}

async function authenticatedContext() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function getCurrentAccountProfile(knownRoles?: AccountRole[]): Promise<AccountProfile | null> {
  const ctx = await authenticatedContext();
  if (!ctx) return null;

  const { data: profile, error: profileError } = await ctx.supabase
    .from("profiles")
    .select("id,full_name,email,phone,avatar_url,status,created_at")
    .eq("id", ctx.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    if (profileError) console.error("Unable to load account profile:", profileError.message);
    return null;
  }

  let roles = knownRoles ? [...knownRoles] : [];
  if (!knownRoles) {
    const { data: roleRows, error: roleError } = await ctx.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.user.id);

    if (roleError) console.error("Unable to load account roles:", roleError.message);
    roles = (roleRows ?? [])
      .map((row: { role: unknown }) => normalizeRole(row.role))
      .filter((role: AccountRole | null): role is AccountRole => Boolean(role));
  }

  return {
    id: profile.id,
    fullName: profile.full_name ?? "Nenasala User",
    email: profile.email ?? ctx.user.email ?? "",
    phone: profile.phone ?? "",
    avatarUrl: profile.avatar_url ?? null,
    status: (profile.status ?? "active") as AccountProfile["status"],
    createdAt: profile.created_at ?? null,
    roles,
  };
}

export async function getCurrentStudentAccountProfile(): Promise<StudentAccountProfile | null> {
  const ctx = await authenticatedContext();
  if (!ctx) return null;

  const [profileResult, studentResult, enrollmentResult] = await Promise.all([
    ctx.supabase
      .from("profiles")
      .select("id,full_name,email,phone,avatar_url,status,created_at")
      .eq("id", ctx.user.id)
      .maybeSingle(),
    ctx.supabase
      .from("student_profiles")
      .select("profile_id,student_number,joined_at")
      .eq("profile_id", ctx.user.id)
      .maybeSingle(),
    ctx.supabase
      .from("enrollments")
      .select("id,status,enrolled_at,completed_at,intakes(name,programmes(name))")
      .eq("student_id", ctx.user.id)
      .order("enrolled_at", { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error || !profileResult.data) {
    if (profileResult.error) console.error("Unable to load student profile:", profileResult.error.message);
    return null;
  }
  if (studentResult.error || !studentResult.data) {
    if (studentResult.error) console.error("Unable to load student identity:", studentResult.error.message);
    return null;
  }
  if (enrollmentResult.error) console.error("Unable to load student enrollment summary:", enrollmentResult.error.message);

  const priority: Record<string, number> = {
    active: 0,
    paused: 1,
    pending: 2,
    completed: 3,
    cancelled: 4,
  };

  const enrollmentRows = [...(enrollmentResult.data ?? [])].sort((a: any, b: any) => {
    const byStatus = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
    if (byStatus !== 0) return byStatus;
    return String(b.enrolled_at ?? "").localeCompare(String(a.enrolled_at ?? ""));
  });

  const current = enrollmentRows[0] as any | undefined;
  const intake = firstRelation(current?.intakes as any) as any;
  const programme = firstRelation(intake?.programmes as any) as any;

  const currentEnrollment: StudentEnrollmentSummary | null = current
    ? {
        id: current.id,
        status: current.status,
        enrolledAt: current.enrolled_at ?? null,
        completedAt: current.completed_at ?? null,
        intakeName: intake?.name ?? null,
        programmeName: programme?.name ?? null,
      }
    : null;

  const profile = profileResult.data;
  return {
    id: profile.id,
    fullName: profile.full_name ?? "Student",
    email: profile.email ?? ctx.user.email ?? "",
    phone: profile.phone ?? "",
    avatarUrl: profile.avatar_url ?? null,
    status: (profile.status ?? "active") as AccountProfile["status"],
    createdAt: profile.created_at ?? null,
    roles: ["student"],
    studentNumber: studentResult.data.student_number,
    joinedAt: studentResult.data.joined_at ?? null,
    currentEnrollment,
  };
}
