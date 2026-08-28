import "server-only";

import type { Notification } from "@/features/student/types";
import { createClient } from "@/lib/supabase/server";

const NOTIFICATION_COLUMNS = "id,title,message,type,link,read_at,created_at" as const;

export async function getCurrentStudentNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Unable to load student notifications:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.created_at,
    read: Boolean(row.read_at),
    type: row.type as Notification["type"],
    link: row.link ?? undefined,
  }));
}
