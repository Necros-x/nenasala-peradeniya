"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { notificationEmail } from "@/lib/email/templates";

export type InstructorActionResult = {
  ok: boolean;
  error?: string;
  email?: string;
  delivery?: "resend";
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function csv(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function normaliseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function revalidateInstructorPaths(accessKey: string) {
  revalidatePath(`/internal/${accessKey}/instructors`);
  revalidatePath(`/internal/${accessKey}/instructor-portal`);
  revalidatePath(`/internal/${accessKey}/instructor-portal/dashboard`);
  revalidatePath(`/internal/${accessKey}/instructor-portal/classes`);
  revalidatePath(`/internal/${accessKey}/lms/classes`);
}

export async function registerInstructorAction(formData: FormData): Promise<InstructorActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealAdmin();
  if (!actor) return { ok: false, error: "Demo/preview mode is read-only." };

  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const phone = nullableText(formData, "phone");
  const professionalTitle = nullableText(formData, "professional_title");
  const bio = nullableText(formData, "bio");
  const qualifications = csv(text(formData, "qualifications"));
  const expertise = csv(text(formData, "expertise"));
  const isPublic = text(formData, "is_public") === "on";

  if (fullName.length < 2) return { ok: false, error: "Lecturer name is required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid lecturer email." };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return {
      ok: false,
      error: "Resend is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL before inviting lecturers.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "The server-side Supabase admin client is not configured." };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return { ok: false, error: "An account already exists for that email address. Delete the old lecturer first or use another email." };
  }

  const requestHeaders = await headers();
  const configuredSite = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const requestOrigin = normaliseOrigin(requestHeaders.get("origin"));
  const host = requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const fallbackOrigin = host ? `${forwardedProto}://${host}` : null;
  const origin = configuredSite ?? requestOrigin ?? fallbackOrigin ?? "http://localhost:3000";

  const returnTo = `/internal/${accessKey}`;
  const redirectTo = `${origin}/reset-password?next=${encodeURIComponent(returnTo)}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo,
      data: { full_name: fullName },
    },
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Unable to create the lecturer invitation." };
  }

  const instructorId = data.user.id;
  const actionLink = data.properties?.action_link ?? null;

  try {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName, email, phone, status: "active" })
      .eq("id", instructorId);
    if (profileError) throw profileError;

    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: instructorId, role: "instructor" });
    if (roleError) throw roleError;

    const { error: instructorError } = await admin
      .from("instructor_profiles")
      .insert({
        profile_id: instructorId,
        professional_title: professionalTitle,
        bio,
        qualifications,
        expertise,
        is_public: isPublic,
      });
    if (instructorError) throw instructorError;

    if (!actionLink) throw new Error("The lecturer invite link was not generated.");

    const template = notificationEmail({
      name: fullName,
      title: "Your Nenasala lecturer account is ready",
      message: "You have been invited to the Nenasala Peradeniya Lecturer Portal. Set your password, then use the secure internal access link to open your lecturer workspace.",
      actionLabel: "Set up lecturer account",
      actionUrl: actionLink,
    });

    const sent = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!sent.ok) throw new Error(sent.error ?? "Unable to send the lecturer invitation email through Resend.");

    await admin.from("audit_logs").insert({
      actor_id: actor.id,
      action: "instructor.registered",
      entity_type: "instructor",
      entity_id: instructorId,
      metadata: { email, is_public: isPublic, invitation_delivery: "resend" },
    });

    revalidateInstructorPaths(accessKey);
    return { ok: true, email, delivery: "resend" };
  } catch (finishError) {
    console.error("Unable to finish lecturer registration:", finishError);
    await admin.auth.admin.deleteUser(instructorId).catch(() => undefined);
    return {
      ok: false,
      error: finishError instanceof Error
        ? finishError.message
        : "The lecturer account could not be completed. The partial account was rolled back.",
    };
  }
}

export async function updateInstructorAction(formData: FormData): Promise<InstructorActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealAdmin();
  if (!actor) return { ok: false, error: "Demo/preview mode is read-only." };

  const instructorId = text(formData, "instructor_id");
  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const phone = nullableText(formData, "phone");
  const professionalTitle = nullableText(formData, "professional_title");
  const bio = nullableText(formData, "bio");
  const qualifications = csv(text(formData, "qualifications"));
  const expertise = csv(text(formData, "expertise"));
  const isPublic = text(formData, "is_public") === "on";
  const status = text(formData, "status");

  if (!instructorId) return { ok: false, error: "Lecturer is required." };
  if (fullName.length < 2) return { ok: false, error: "Lecturer name is required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid lecturer email." };
  if (!["active", "inactive", "suspended"].includes(status)) return { ok: false, error: "Invalid account status." };

  const admin = createAdminClient();

  const { data: instructor } = await admin
    .from("instructor_profiles")
    .select("profile_id")
    .eq("profile_id", instructorId)
    .maybeSingle();

  if (!instructor) return { ok: false, error: "Lecturer account could not be found." };

  const { data: protectedRoles, error: roleCheckError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", instructorId)
    .in("role", ["admin", "super_admin"])
    .limit(1);

  if (roleCheckError) return { ok: false, error: roleCheckError.message };
  if ((protectedRoles?.length ?? 0) > 0) {
    return {
      ok: false,
      error: "This lecturer also has administrative privileges. Manage that account from Internal Accounts instead.",
    };
  }

  const { error: authError } = await admin.auth.admin.updateUserById(instructorId, {
    email,
    user_metadata: { full_name: fullName },
  });
  if (authError) return { ok: false, error: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, email, phone, status })
    .eq("id", instructorId);
  if (profileError) return { ok: false, error: profileError.message };

  const { error: instructorError } = await admin
    .from("instructor_profiles")
    .update({
      professional_title: professionalTitle,
      bio,
      qualifications,
      expertise,
      is_public: isPublic,
    })
    .eq("profile_id", instructorId);
  if (instructorError) return { ok: false, error: instructorError.message };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "instructor.updated",
    entity_type: "instructor",
    entity_id: instructorId,
    metadata: { email, status, is_public: isPublic },
  });

  revalidateInstructorPaths(accessKey);
  return { ok: true, email };
}

export async function deleteInstructorAction(formData: FormData): Promise<InstructorActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealAdmin();
  if (!actor) return { ok: false, error: "Demo/preview mode is read-only." };

  const instructorId = text(formData, "instructor_id");
  if (!instructorId) return { ok: false, error: "Lecturer is required." };

  const admin = createAdminClient();

  const { data: instructor } = await admin
    .from("instructor_profiles")
    .select("profile_id")
    .eq("profile_id", instructorId)
    .maybeSingle();

  if (!instructor) return { ok: false, error: "Lecturer account could not be found." };

  const { data: protectedRoles, error: roleCheckError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", instructorId)
    .in("role", ["admin", "super_admin"])
    .limit(1);

  if (roleCheckError) return { ok: false, error: roleCheckError.message };
  if ((protectedRoles?.length ?? 0) > 0) {
    return {
      ok: false,
      error: "This lecturer also has administrative privileges. Manage that account from Internal Accounts instead.",
    };
  }

  const { count: assignedClasses } = await admin
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId);

  const { error: unassignError } = await admin
    .from("classes")
    .update({ instructor_id: null })
    .eq("instructor_id", instructorId);

  if (unassignError) {
    return { ok: false, error: `Unable to unassign lecturer classes: ${unassignError.message}` };
  }

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "instructor.deleted",
    entity_type: "instructor",
    entity_id: instructorId,
    metadata: { assigned_classes_unassigned: assignedClasses ?? 0 },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(instructorId);
  if (deleteError) return { ok: false, error: deleteError.message };

  revalidateInstructorPaths(accessKey);
  return { ok: true };
}
