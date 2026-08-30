import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRealAdmin } from "@/lib/auth/guards";

export type PlatformSettingsRecord = {
  institution_name: string;
  support_email: string | null;
  support_phone: string | null;
  address: string | null;
  contact_notification_email: string | null;
  contact_form_enabled: boolean;
  contact_auto_reply_enabled: boolean;
};

const defaults: PlatformSettingsRecord = {
  institution_name: "Nenasala Peradeniya",
  support_email: null,
  support_phone: null,
  address: null,
  contact_notification_email: null,
  contact_form_enabled: true,
  contact_auto_reply_enabled: true,
};

async function readSettings(): Promise<PlatformSettingsRecord> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return defaults;
  }

  const { data, error } = await admin
    .from("platform_settings")
    .select("institution_name,support_email,support_phone,address,contact_notification_email,contact_form_enabled,contact_auto_reply_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load platform settings:", error.message);
    return defaults;
  }

  return data ?? defaults;
}

export async function getAdminPlatformSettings() {
  const actor = await requireRealAdmin();
  if (!actor) {
    return {
      settings: defaults,
      resend: {
        configured: false,
        from: null as string | null,
        replyTo: null as string | null,
      },
    };
  }

  return {
    settings: await readSettings(),
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      from: process.env.RESEND_FROM_EMAIL ?? null,
      replyTo: process.env.RESEND_REPLY_TO ?? null,
    },
  };
}

export async function getPublicPlatformSettings(): Promise<PlatformSettingsRecord> {
  return readSettings();
}
