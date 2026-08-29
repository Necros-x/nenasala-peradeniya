import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmails, type NotificationEmailCategory } from "@/lib/email/notifications";

export async function deliverNotification({
  userIds,
  title,
  message,
  type,
  link,
  sourceKey,
  emailCategory,
  actionLabel,
}: {
  userIds: string[];
  title: string;
  message: string;
  type: string;
  link?: string | null;
  sourceKey: string;
  emailCategory?: NotificationEmailCategory;
  actionLabel?: string;
}) {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (recipients.length === 0) return { ok: true, newRecipients: [] as string[] };

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("notifications")
    .select("user_id")
    .eq("source_key", sourceKey)
    .in("user_id", recipients);

  if (existingError) console.error("Unable to inspect existing notifications:", existingError.message);
  const existingSet = new Set((existing ?? []).map((row) => row.user_id));
  const newRecipients = recipients.filter((userId) => !existingSet.has(userId));

  const { error } = await admin.from("notifications").upsert(
    recipients.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      link: link ?? null,
      source_key: sourceKey,
    })),
    { onConflict: "user_id,source_key" }
  );

  if (error) {
    console.error("Unable to deliver notification:", error.message);
    return { ok: false, newRecipients: [] as string[] };
  }

  if (emailCategory && newRecipients.length > 0) {
    await sendNotificationEmails({
      userIds: newRecipients,
      category: emailCategory,
      title,
      message,
      link,
      actionLabel,
    });
  }

  return { ok: true, newRecipients };
}
