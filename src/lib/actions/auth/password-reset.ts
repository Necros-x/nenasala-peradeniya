"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordResetEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";

function siteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL;
  if (!base) return null;
  try {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return null;
  }
}

export async function requestPasswordResetAction(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: true };

  const redirectTo = siteUrl("/reset-password");
  if (!redirectTo) {
    console.error("NEXT_PUBLIC_SITE_URL or APP_URL is required for custom password-reset emails.");
    return { ok: true };
  }

  try {
    const admin = createAdminClient();
    const emailHash = createHash("sha256").update(email).digest("hex");
    const { data: throttle } = await admin
      .from("password_reset_throttle")
      .select("last_requested_at")
      .eq("email_hash", emailHash)
      .maybeSingle();
    if (throttle?.last_requested_at && Date.now() - new Date(throttle.last_requested_at).getTime() < 2 * 60_000) {
      return { ok: true };
    }
    await admin.from("password_reset_throttle").upsert({
      email_hash: emailHash,
      last_requested_at: new Date().toISOString(),
    }, { onConflict: "email_hash" });

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name,email")
      .ilike("email", email)
      .maybeSingle();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      if (error && !error.message.toLowerCase().includes("not found")) {
        console.error("Unable to generate password reset link:", error.message);
      }
      return { ok: true };
    }

    const template = passwordResetEmail({
      name: profile?.full_name ?? "Student",
      actionUrl: data.properties.action_link,
    });
    const result = await sendEmail({ to: profile?.email ?? email, ...template });
    if (!result.ok && !result.skipped) console.error("Unable to send password reset email:", result.error);
  } catch (error) {
    console.error("Password reset request failed:", error);
  }

  // Always return the same response so this endpoint does not reveal registered emails.
  return { ok: true };
}
