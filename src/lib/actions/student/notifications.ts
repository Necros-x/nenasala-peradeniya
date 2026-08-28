"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function currentUserId() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

function safeInternalPath(value: unknown) {
  if (typeof value !== "string") return "/student/notifications";
  return value.startsWith("/student/") ? value : "/student/notifications";
}

export async function openStudentNotificationAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!notificationId) redirect("/student/notifications");

  const admin = createAdminClient();
  const { data: notification } = await admin
    .from("notifications")
    .select("id,link,read_at")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!notification) redirect("/student/notifications");

  if (!notification.read_at) {
    await admin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id)
      .eq("user_id", userId);
  }

  revalidatePath("/student/notifications");
  redirect(safeInternalPath(notification.link));
}

export async function markAllStudentNotificationsReadAction() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) console.error("Unable to mark notifications as read:", error.message);
  revalidatePath("/student/notifications");
}
