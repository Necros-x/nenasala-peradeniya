"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdministrationActor } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { contactReplyEmail } from "@/lib/email/contact-templates";
import { getPublicPlatformSettings } from "@/lib/services/platform-settings";

export type ContactMessageActionResult = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function authorize(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { accessKey, actor: null };

  const actor = await requireRealAdministrationActor();
  return { accessKey, actor };
}

export async function saveContactMessageAction(
  formData: FormData,
): Promise<ContactMessageActionResult> {
  const { accessKey, actor } = await authorize(formData);
  if (!actor) return { ok: false, error: "A real Staff, Admin or Super Admin account is required." };

  const messageId = text(formData, "message_id");
  const status = text(formData, "status");
  const notes = text(formData, "admin_notes");

  if (!messageId) return { ok: false, error: "Missing inquiry." };
  if (!["new", "read", "replied", "closed"].includes(status)) {
    return { ok: false, error: "Invalid message status." };
  }
  if (notes.length > 5000) return { ok: false, error: "Internal notes are too long." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_messages")
    .update({
      status,
      admin_notes: notes || null,
    })
    .eq("id", messageId);

  if (error) return { ok: false, error: error.message };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "contact_message.updated",
    entity_type: "contact_message",
    entity_id: messageId,
    metadata: { status },
  });

  revalidatePath(`/internal/${accessKey}/messages`);
  return { ok: true };
}

export async function replyContactMessageAction(
  formData: FormData,
): Promise<ContactMessageActionResult> {
  const { accessKey, actor } = await authorize(formData);
  if (!actor) return { ok: false, error: "A real Staff, Admin or Super Admin account is required." };

  const messageId = text(formData, "message_id");
  const body = text(formData, "body");

  if (!messageId) return { ok: false, error: "Missing inquiry." };
  if (body.length < 1 || body.length > 10000) {
    return { ok: false, error: "Reply must be between 1 and 10,000 characters." };
  }

  const admin = createAdminClient();
  const { data: message, error: messageError } = await admin
    .from("contact_messages")
    .select("id,name,email,subject")
    .eq("id", messageId)
    .maybeSingle();

  if (messageError || !message) return { ok: false, error: "Inquiry could not be found." };

  const settings = await getPublicPlatformSettings();
  const template = contactReplyEmail({
    name: message.name,
    subject: message.subject,
    message: body,
    institutionName: settings.institution_name,
  });

  const sent = await sendEmail({
    to: message.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: settings.support_email ?? undefined,
  });

  await admin.from("contact_message_replies").insert({
    message_id: messageId,
    sender_id: actor.id,
    body,
    resend_email_id: sent.id ?? null,
    delivery_status: sent.ok ? "sent" : "failed",
  });

  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "The reply could not be delivered through Resend." };
  }

  const now = new Date().toISOString();
  await admin
    .from("contact_messages")
    .update({
      status: "replied",
      last_replied_at: now,
      last_replied_by: actor.id,
    })
    .eq("id", messageId);

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "contact_message.replied",
    entity_type: "contact_message",
    entity_id: messageId,
    metadata: { email: message.email },
  });

  revalidatePath(`/internal/${accessKey}/messages`);
  return { ok: true };
}
