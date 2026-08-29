import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { notificationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";

export type NotificationEmailCategory =
  | "announcements"
  | "assignments"
  | "quizzes"
  | "live_sessions"
  | "course_updates"
  | "certificates";

const preferenceColumn: Record<NotificationEmailCategory, string> = {
  announcements: "email_announcements",
  assignments: "email_assignments",
  quizzes: "email_quizzes",
  live_sessions: "email_live_sessions",
  course_updates: "email_course_updates",
  certificates: "email_certificates",
};

function absoluteUrl(path: string | null | undefined) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL;
  if (!base) return undefined;
  try {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return undefined;
  }
}

export async function sendNotificationEmails({
  userIds,
  category,
  title,
  message,
  link,
  actionLabel,
}: {
  userIds: string[];
  category: NotificationEmailCategory;
  title: string;
  message: string;
  link?: string | null;
  actionLabel?: string;
}) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const [profilesResult, preferencesResult] = await Promise.all([
    admin.from("profiles").select("id,full_name,email").in("id", uniqueIds),
    admin.from("user_preferences").select("user_id,email_announcements,email_assignments,email_quizzes,email_live_sessions,email_course_updates,email_certificates").in("user_id", uniqueIds),
  ]);

  if (profilesResult.error) {
    console.error("Unable to resolve email recipients:", profilesResult.error.message);
    return;
  }
  if (preferencesResult.error) {
    console.error("Unable to load email preferences:", preferencesResult.error.message);
  }

  const preferences = new Map((preferencesResult.data ?? []).map((row) => [row.user_id, row as Record<string, unknown>] as const));
  const column = preferenceColumn[category];
  const actionUrl = absoluteUrl(link);

  await Promise.allSettled((profilesResult.data ?? []).map(async (profile) => {
    if (!profile.email) return;
    const row = preferences.get(profile.id);
    if (row && row[column] === false) return;

    const template = notificationEmail({
      name: profile.full_name ?? "Student",
      title,
      message,
      actionLabel,
      actionUrl,
    });
    const result = await sendEmail({ to: profile.email, ...template });
    if (!result.ok && !result.skipped) {
      console.error(`Unable to send ${category} email to ${profile.id}:`, result.error);
    }
  }));
}
