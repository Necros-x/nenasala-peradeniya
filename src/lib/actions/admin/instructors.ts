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
  delivery?: "resend" | "supabase";
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

  if (fullName.length < 2) return { ok: false, error: "Instructor name is required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid instructor email." };

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
  if (existingProfile) return { ok: false, error: "An account already exists for that email address." };

  const requestHeaders = await headers();
  const configuredSite = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const requestOrigin = normaliseOrigin(requestHeaders.get("origin"));
  const host = requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const fallbackOrigin = host ? `${forwardedProto}://${host}` : null;
  const origin = configuredSite ?? requestOrigin ?? fallbackOrigin ?? "http://localhost:3000";
  const redirectTo = `${origin}/reset-password`;

  const useResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  let instructorId = "";
  let actionLink: string | null = null;
  let delivery: "resend" | "supabase" = useResend ? "resend" : "supabase";

  if (useResend) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: { full_name: fullName },
      },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Unable to create the instructor invitation." };
    }
    instructorId = data.user.id;
    actionLink = data.properties?.action_link ?? null;
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: fullName },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Unable to send the instructor invitation." };
    }
    instructorId = data.user.id;
  }

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

    if (useResend) {
      if (!actionLink) throw new Error("The instructor invite link was not generated.");
      const template = notificationEmail({
        name: fullName,
        title: "Your Nenasala instructor account is ready",
        message: "You have been invited to the Nenasala Peradeniya lecturer portal. Set your password to access your assigned classes, student progress, grading and learning tools.",
        actionLabel: "Set up instructor account",
        actionUrl: actionLink,
      });
      const sent = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      if (!sent.ok) throw new Error(sent.error ?? "Unable to send the instructor invitation email.");
    }

    await admin.from("audit_logs").insert({
      actor_id: actor.id,
      action: "instructor.registered",
      entity_type: "instructor",
      entity_id: instructorId,
      metadata: { email, is_public: isPublic, invitation_delivery: delivery },
    });

    revalidatePath(`/internal/${accessKey}/instructors`);
    revalidatePath(`/internal/${accessKey}/lms/classes`);

    return { ok: true, email, delivery };
  } catch (error) {
    console.error("Unable to finish instructor registration:", error);
    await admin.auth.admin.deleteUser(instructorId).catch(() => undefined);
    return {
      ok: false,
      error: "The instructor account could not be completed. The partial account was rolled back; please try again.",
    };
  }
}
