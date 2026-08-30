"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import {
  contactAcknowledgementEmail,
  contactInternalNotificationEmail,
} from "@/lib/email/contact-templates";
import { getPublicPlatformSettings } from "@/lib/services/platform-settings";

export type ContactSubmitResult = {
  ok: boolean;
  error?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

export async function submitContactMessageAction(
  formData: FormData,
): Promise<ContactSubmitResult> {
  const honeypot = text(formData, "website");
  if (honeypot) return { ok: true };

  const settings = await getPublicPlatformSettings();
  if (!settings.contact_form_enabled) {
    return { ok: false, error: "The contact form is temporarily unavailable." };
  }

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const phone = optional(formData, "phone");
  const category = text(formData, "category") || "general";
  const subject = text(formData, "subject");
  const message = text(formData, "message");

  if (name.length < 2 || name.length > 120) return { ok: false, error: "Enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (phone && phone.length > 40) return { ok: false, error: "Phone number is too long." };
  if (!["general", "course", "enrollment", "technical", "certificate", "other"].includes(category)) {
    return { ok: false, error: "Choose a valid inquiry category." };
  }
  if (subject.length < 2 || subject.length > 180) return { ok: false, error: "Enter a subject." };
  if (message.length < 5 || message.length > 10000) {
    return { ok: false, error: "Message must be between 5 and 10,000 characters." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "The contact service is not configured on this environment." };
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60_000).toISOString();

  const { count, error: countError } = await admin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", fifteenMinutesAgo);

  if (countError) {
    console.error("Unable to check contact rate limit:", countError.message);
    return { ok: false, error: "Unable to submit your message right now." };
  }

  if ((count ?? 0) >= 3) {
    return { ok: false, error: "Too many messages were sent recently. Please try again in a few minutes." };
  }

  const { data: created, error: insertError } = await admin
    .from("contact_messages")
    .insert({
      name,
      email,
      phone,
      category,
      subject,
      message,
      status: "new",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("Unable to save contact message:", insertError);
    return { ok: false, error: "Unable to submit your message right now." };
  }

  const inbox = settings.contact_notification_email ?? settings.support_email ?? process.env.RESEND_REPLY_TO ?? null;

  if (inbox) {
    const internalTemplate = contactInternalNotificationEmail({
      name,
      email,
      category,
      subject,
      message,
    });

    const sent = await sendEmail({
      to: inbox,
      subject: internalTemplate.subject,
      html: internalTemplate.html,
      text: internalTemplate.text,
      replyTo: email,
    });

    if (!sent.ok) console.error("Contact message saved but internal notification email failed:", sent.error);
  }

  if (settings.contact_auto_reply_enabled) {
    const acknowledgement = contactAcknowledgementEmail({
      name,
      subject,
      institutionName: settings.institution_name,
    });

    const sent = await sendEmail({
      to: email,
      subject: acknowledgement.subject,
      html: acknowledgement.html,
      text: acknowledgement.text,
      replyTo: settings.support_email ?? undefined,
    });

    if (!sent.ok) console.error("Contact acknowledgement email failed:", sent.error);
  }

  return { ok: true };
}
