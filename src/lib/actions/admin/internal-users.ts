"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireRealSuperAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { notificationEmail } from "@/lib/email/templates";

export type InternalUserActionResult = {
  ok: boolean;
  error?: string;
  email?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function normaliseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

async function portalOrigin() {
  const requestHeaders = await headers();
  const configuredSite = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const requestOrigin = normaliseOrigin(requestHeaders.get("origin"));
  const host = requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  return configuredSite ?? requestOrigin ?? (host ? `${forwardedProto}://${host}` : null) ?? "http://localhost:3000";
}

async function targetIsSuperAdmin(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return Boolean(data);
}

export async function inviteInternalUserAction(
  formData: FormData,
): Promise<InternalUserActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealSuperAdmin();
  if (!actor) return { ok: false, error: "Only a real Super Admin can invite internal accounts." };

  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const phone = nullableText(formData, "phone");
  const role = text(formData, "role");

  if (fullName.length < 2) return { ok: false, error: "Full name is required." };
  if (!validEmail(email)) return { ok: false, error: "Enter a valid email address." };
  if (!["staff", "admin"].includes(role)) {
    return { ok: false, error: "Only Staff or Admin accounts can be created here." };
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "Resend is not configured. Internal invitations require Resend." };
  }

  const admin = createAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) return { ok: false, error: "An account already exists for that email address." };

  const origin = await portalOrigin();
  const next = `/internal/${accessKey}`;
  const redirectTo = `${origin}/reset-password?next=${encodeURIComponent(next)}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo,
      data: { full_name: fullName },
    },
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Unable to create the internal account." };
  }

  const userId = data.user.id;
  const actionLink = data.properties?.action_link ?? null;

  try {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        phone,
        status: "active",
      })
      .eq("id", userId);
    if (profileError) throw profileError;

    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (roleError) throw roleError;

    if (!actionLink) throw new Error("The account setup link was not generated.");

    const template = notificationEmail({
      name: fullName,
      title: "Your Nenasala internal account is ready",
      message:
        role === "admin"
          ? "You have been invited as an Administrator. Set your password to access the Administration, LMS Management and Analytics workspaces."
          : "You have been invited as Nenasala Staff. Set your password to access the internal Communications workspace.",
      actionLabel: "Set up account",
      actionUrl: actionLink,
    });

    const sent = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (!sent.ok) throw new Error(sent.error ?? "Unable to send the invitation email.");

    await admin.from("audit_logs").insert({
      actor_id: actor.id,
      action: "internal_user.invited",
      entity_type: "profile",
      entity_id: userId,
      metadata: { email, role },
    });

    revalidatePath(`/internal/${accessKey}/staff`);
    return { ok: true, email };
  } catch (failure) {
    console.error("Unable to complete internal account invitation:", failure);
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return {
      ok: false,
      error: "The internal account could not be completed. The partial account was rolled back.",
    };
  }
}

export async function updateInternalUserAction(
  formData: FormData,
): Promise<InternalUserActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealSuperAdmin();
  if (!actor) return { ok: false, error: "Only a real Super Admin can edit internal accounts." };

  const userId = text(formData, "user_id");
  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const phone = nullableText(formData, "phone");
  const role = text(formData, "role");
  const status = text(formData, "status");

  if (!userId) return { ok: false, error: "Missing internal user." };
  if (await targetIsSuperAdmin(userId)) {
    return { ok: false, error: "Super Admin accounts cannot be modified from this screen." };
  }
  if (fullName.length < 2) return { ok: false, error: "Full name is required." };
  if (!validEmail(email)) return { ok: false, error: "Enter a valid email address." };
  if (!["staff", "admin"].includes(role)) return { ok: false, error: "Invalid role." };
  if (!["active", "inactive", "suspended"].includes(status)) {
    return { ok: false, error: "Invalid account status." };
  }

  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    email,
    user_metadata: { full_name: fullName },
  });
  if (authError) return { ok: false, error: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, email, phone, status })
    .eq("id", userId);
  if (profileError) return { ok: false, error: profileError.message };

  const { error: deleteRoleError } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .in("role", ["staff", "admin"]);
  if (deleteRoleError) return { ok: false, error: deleteRoleError.message };

  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role });
  if (roleError) return { ok: false, error: roleError.message };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "internal_user.updated",
    entity_type: "profile",
    entity_id: userId,
    metadata: { email, role, status },
  });

  revalidatePath(`/internal/${accessKey}/staff`);
  return { ok: true, email };
}

export async function deleteInternalUserAction(
  formData: FormData,
): Promise<InternalUserActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealSuperAdmin();
  if (!actor) return { ok: false, error: "Only a real Super Admin can delete internal accounts." };

  const userId = text(formData, "user_id");
  if (!userId) return { ok: false, error: "Missing internal user." };
  if (userId === actor.id) return { ok: false, error: "You cannot delete your own account." };
  if (await targetIsSuperAdmin(userId)) {
    return { ok: false, error: "Super Admin accounts cannot be deleted from this screen." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email,full_name")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "internal_user.deleted",
    entity_type: "profile",
    entity_id: null,
    metadata: {
      deleted_user_id: userId,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
    },
  });

  revalidatePath(`/internal/${accessKey}/staff`);
  return { ok: true, email: profile?.email ?? undefined };
}
