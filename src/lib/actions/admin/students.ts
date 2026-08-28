"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterStudentResult = {
  ok: boolean;
  error?: string;
  studentNumber?: string;
  email?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? value : null;
}

function normaliseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export async function registerStudentAction(formData: FormData): Promise<RegisterStudentResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealAdmin();
  if (!actor) {
    return {
      ok: false,
      error: "Demo/preview mode is read-only. Sign in with a real admin account to register students.",
    };
  }

  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const fullName = `${firstName} ${lastName}`.trim();
  const email = text(formData, "email").toLowerCase();
  const phone = nullableText(formData, "phone");
  const dateOfBirth = nullableText(formData, "date_of_birth");
  const address = nullableText(formData, "address");
  const intakeId = text(formData, "intake_id");

  if (firstName.length < 1 || lastName.length < 1) return { ok: false, error: "Student first and last name are required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid student email address." };
  if (!intakeId) return { ok: false, error: "Select an intake for the student." };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    console.error(error);
    return { ok: false, error: "The server-side Supabase admin client is not configured." };
  }

  const { data: intake, error: intakeError } = await adminClient
    .from("intakes")
    .select("id,status")
    .eq("id", intakeId)
    .maybeSingle();

  if (intakeError || !intake) return { ok: false, error: "The selected intake could not be found." };
  if (["completed", "closed"].includes(intake.status)) {
    return { ok: false, error: "Students cannot be enrolled into a completed or closed intake." };
  }

  const requestHeaders = await headers();
  const configuredSite = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const requestOrigin = normaliseOrigin(requestHeaders.get("origin"));
  const host = requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const fallbackOrigin = host ? `${forwardedProto}://${host}` : null;
  const origin = configuredSite ?? requestOrigin ?? fallbackOrigin ?? "http://localhost:3000";
  const redirectTo = `${origin}/reset-password`;

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullName },
  });

  if (inviteError || !inviteData.user) {
    const message = inviteError?.message?.toLowerCase().includes("already")
      ? "An account already exists for that email address."
      : inviteError?.message ?? "Unable to send the student invitation.";
    return { ok: false, error: message };
  }

  const studentId = inviteData.user.id;

  try {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ full_name: fullName, email, phone, status: "active" })
      .eq("id", studentId);
    if (profileError) throw profileError;

    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: studentId, role: "student" });
    if (roleError) throw roleError;

    const { data: studentProfile, error: studentError } = await adminClient
      .from("student_profiles")
      .insert({
        profile_id: studentId,
        date_of_birth: dateOfBirth,
        address,
      })
      .select("student_number")
      .single();
    if (studentError || !studentProfile) throw studentError ?? new Error("Student profile was not created.");

    const { error: enrollmentError } = await adminClient
      .from("enrollments")
      .insert({ student_id: studentId, intake_id: intakeId, status: "active" });
    if (enrollmentError) throw enrollmentError;

    await adminClient.from("audit_logs").insert({
      actor_id: actor.id,
      action: "student.registered",
      entity_type: "student",
      entity_id: studentId,
      metadata: { student_number: studentProfile.student_number, intake_id: intakeId },
    });

    revalidatePath(`/internal/${accessKey}/students`);
    revalidatePath(`/internal/${accessKey}/lms/students`);

    return {
      ok: true,
      studentNumber: studentProfile.student_number,
      email,
    };
  } catch (error) {
    console.error("Unable to finish student registration:", error);
    await adminClient.auth.admin.deleteUser(studentId).catch(() => undefined);
    return {
      ok: false,
      error: "The invitation was created, but the student profile could not be completed. The partial account was rolled back; please try again.",
    };
  }
}

export async function updateEnrollmentStatusAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealAdmin();
  if (!actor) return { ok: false, error: "Demo/preview mode is read-only." };

  const enrollmentId = text(formData, "enrollment_id");
  const status = text(formData, "status");
  if (!enrollmentId || !["pending", "active", "paused", "completed", "cancelled"].includes(status)) {
    return { ok: false, error: "Invalid enrollment update." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { ok: false, error: "The server-side Supabase admin client is not configured." };
  }

  const payload = {
    status: status as "pending" | "active" | "paused" | "completed" | "cancelled",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const { data, error } = await adminClient
    .from("enrollments")
    .update(payload)
    .eq("id", enrollmentId)
    .select("id,student_id,intake_id")
    .single();

  if (error || !data) return { ok: false, error: "Unable to update the enrollment." };

  await adminClient.from("audit_logs").insert({
    actor_id: actor.id,
    action: "enrollment.status_changed",
    entity_type: "enrollment",
    entity_id: data.id,
    metadata: { student_id: data.student_id, intake_id: data.intake_id, status },
  });

  revalidatePath(`/internal/${accessKey}/enrollments`);
  revalidatePath(`/internal/${accessKey}/students`);
  revalidatePath(`/internal/${accessKey}/lms/students`);
  revalidatePath("/student/courses");
  return { ok: true };
}
