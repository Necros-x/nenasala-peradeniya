"use server";

import { revalidatePath } from "next/cache";
import { requireRealSuperAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlatformSettingsActionResult = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function validOptionalEmail(value: string | null) {
  return !value || /^\S+@\S+\.\S+$/.test(value);
}

export async function savePlatformSettingsAction(
  formData: FormData,
): Promise<PlatformSettingsActionResult> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const actor = await requireRealSuperAdmin();
  if (!actor) return { ok: false, error: "Only a real Super Admin can change platform settings." };

  const institutionName = text(formData, "institution_name");
  const supportEmail = nullableText(formData, "support_email");
  const supportPhone = nullableText(formData, "support_phone");
  const address = nullableText(formData, "address");
  const contactNotificationEmail = nullableText(formData, "contact_notification_email");

  if (institutionName.length < 2 || institutionName.length > 120) {
    return { ok: false, error: "Institution name must be between 2 and 120 characters." };
  }
  if (!validOptionalEmail(supportEmail)) return { ok: false, error: "Support email is invalid." };
  if (!validOptionalEmail(contactNotificationEmail)) {
    return { ok: false, error: "Contact notification email is invalid." };
  }
  if (supportPhone && supportPhone.length > 40) return { ok: false, error: "Support phone is too long." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      institution_name: institutionName,
      support_email: supportEmail,
      support_phone: supportPhone,
      address,
      contact_notification_email: contactNotificationEmail,
      contact_form_enabled: text(formData, "contact_form_enabled") === "on",
      contact_auto_reply_enabled: text(formData, "contact_auto_reply_enabled") === "on",
      updated_by: actor.id,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: error.message };

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "platform_settings.updated",
    entity_type: "platform_settings",
    entity_id: null,
    metadata: {
      contact_form_enabled: text(formData, "contact_form_enabled") === "on",
      contact_auto_reply_enabled: text(formData, "contact_auto_reply_enabled") === "on",
    },
  });

  revalidatePath(`/internal/${accessKey}/settings`);
  revalidatePath("/contact");
  return { ok: true };
}
