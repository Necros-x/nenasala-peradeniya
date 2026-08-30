import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRealAdministrationActor } from "@/lib/auth/guards";

export type ContactMessageStatus = "new" | "read" | "replied" | "closed";

export type ContactMessageReplyRecord = {
  id: string;
  body: string;
  delivery_status: "sent" | "failed";
  resend_email_id: string | null;
  created_at: string;
  sender_name: string;
};

export type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: "general" | "course" | "enrollment" | "technical" | "certificate" | "other";
  subject: string;
  message: string;
  status: ContactMessageStatus;
  admin_notes: string | null;
  last_replied_at: string | null;
  created_at: string;
  replies: ContactMessageReplyRecord[];
};

export async function getContactMessages(): Promise<ContactMessageRecord[]> {
  const actor = await requireRealAdministrationActor();
  if (!actor) return [];

  const admin = createAdminClient();
  const { data: messages, error: messageError } = await admin
    .from("contact_messages")
    .select("id,name,email,phone,category,subject,message,status,admin_notes,last_replied_at,created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (messageError) {
    console.error("Unable to load contact messages:", messageError.message);
    return [];
  }

  const ids = (messages ?? []).map((message) => message.id);
  if (ids.length === 0) return [];

  const { data: replies, error: replyError } = await admin
    .from("contact_message_replies")
    .select("id,message_id,sender_id,body,delivery_status,resend_email_id,created_at")
    .in("message_id", ids)
    .order("created_at", { ascending: true });

  if (replyError) console.error("Unable to load contact replies:", replyError.message);

  const senderIds = [...new Set((replies ?? []).map((reply) => reply.sender_id).filter((id): id is string => Boolean(id)))];
  const senderNames = new Map<string, string>();

  if (senderIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,full_name")
      .in("id", senderIds);

    for (const profile of profiles ?? []) {
      senderNames.set(profile.id, profile.full_name ?? "Internal user");
    }
  }

  const repliesByMessage = new Map<string, ContactMessageReplyRecord[]>();
  for (const reply of replies ?? []) {
    const current = repliesByMessage.get(reply.message_id) ?? [];
    current.push({
      id: reply.id,
      body: reply.body,
      delivery_status: reply.delivery_status as ContactMessageReplyRecord["delivery_status"],
      resend_email_id: reply.resend_email_id ?? null,
      created_at: reply.created_at,
      sender_name: reply.sender_id ? senderNames.get(reply.sender_id) ?? "Internal user" : "Internal user",
    });
    repliesByMessage.set(reply.message_id, current);
  }

  return (messages ?? []).map((message) => ({
    ...message,
    status: message.status as ContactMessageStatus,
    category: message.category as ContactMessageRecord["category"],
    replies: repliesByMessage.get(message.id) ?? [],
  }));
}
