"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AnnouncementAudience, AnnouncementPriority, AnnouncementStatus } from "@/lib/services/announcements";
import { deliverNotification } from "@/lib/notifications/deliver";

export type AnnouncementActionState = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function iso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function adminContext(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." as const };
  const admin = await requireRealAdmin();
  if (!admin) return { error: "Demo/preview mode is read-only." as const };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." as const };
  return { accessKey, admin, supabase };
}

function revalidateAnnouncementPaths(accessKey: string, announcementId?: string) {
  revalidatePath(`/internal/${accessKey}/lms/announcements`);
  revalidatePath("/student/announcements");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/notifications");
  if (announcementId) revalidatePath(`/student/announcements/${announcementId}`);
}

async function enrolledStudentIdsForIntakes(adminClient: ReturnType<typeof createAdminClient>, intakeIds: string[]) {
  if (intakeIds.length === 0) return [] as string[];
  const { data, error } = await adminClient
    .from("enrollments")
    .select("student_id")
    .in("intake_id", intakeIds)
    .in("status", ["active", "paused", "completed"]);
  if (error) throw error;
  return (data ?? []).map((row) => row.student_id);
}

async function resolveRecipientIds(announcementId: string, audience: AnnouncementAudience, targetId: string | null) {
  const adminClient = createAdminClient();

  if (audience === "students") {
    const { data, error } = await adminClient
      .from("announcement_students")
      .select("student_id")
      .eq("announcement_id", announcementId);
    if (error) throw error;
    return [...new Set((data ?? []).map((row) => row.student_id))];
  }

  if (audience === "all_students") {
    const { data, error } = await adminClient.from("student_profiles").select("profile_id");
    if (error) throw error;
    return [...new Set((data ?? []).map((row) => row.profile_id))];
  }

  if (!targetId) return [];

  if (audience === "programme") {
    const { data: intakes, error } = await adminClient.from("intakes").select("id").eq("programme_id", targetId);
    if (error) throw error;
    return [...new Set(await enrolledStudentIdsForIntakes(adminClient, (intakes ?? []).map((row) => row.id)))];
  }

  if (audience === "intake") {
    return [...new Set(await enrolledStudentIdsForIntakes(adminClient, [targetId]))];
  }

  if (audience === "class") {
    const { data: classRow, error } = await adminClient.from("classes").select("intake_id").eq("id", targetId).maybeSingle();
    if (error) throw error;
    if (!classRow?.intake_id) return [];
    return [...new Set(await enrolledStudentIdsForIntakes(adminClient, [classRow.intake_id]))];
  }

  const { data: classes, error } = await adminClient.from("classes").select("intake_id").eq("course_id", targetId);
  if (error) throw error;
  const intakeIds = [...new Set((classes ?? []).map((row) => row.intake_id).filter(Boolean))];
  return [...new Set(await enrolledStudentIdsForIntakes(adminClient, intakeIds))];
}

async function syncAnnouncementNotifications(
  announcementId: string,
  audience: AnnouncementAudience,
  targetId: string | null,
  title: string,
  body: string,
  priority: AnnouncementPriority,
  shouldNotify: boolean
) {
  const adminClient = createAdminClient();
  const sourceKey = `announcement:${announcementId}`;

  if (!shouldNotify) {
    const { error } = await adminClient.from("notifications").delete().eq("source_key", sourceKey);
    if (error) console.error("Unable to clear announcement notifications:", error.message);
    return;
  }

  try {
    const recipients = await resolveRecipientIds(announcementId, audience, targetId);
    const { data: existingRows, error: existingError } = await adminClient
      .from("notifications")
      .select("user_id")
      .eq("source_key", sourceKey);
    if (existingError) console.error("Unable to compare announcement recipients:", existingError.message);

    const recipientSet = new Set(recipients);
    const staleIds = (existingRows ?? []).map((row) => row.user_id).filter((userId) => !recipientSet.has(userId));
    if (staleIds.length > 0) {
      const { error: staleError } = await adminClient
        .from("notifications")
        .delete()
        .eq("source_key", sourceKey)
        .in("user_id", staleIds);
      if (staleError) console.error("Unable to remove stale announcement notifications:", staleError.message);
    }

    if (recipients.length === 0) return;
    const compact = body.replace(/\s+/g, " ").trim();
    const message = compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
    await deliverNotification({
      userIds: recipients,
      title: priority === "urgent" ? `Urgent: ${title}` : title,
      message,
      type: "announcement",
      link: `/student/announcements/${announcementId}`,
      sourceKey,
      emailCategory: "announcements",
      actionLabel: "Read announcement",
    });
  } catch (error) {
    console.error("Announcement saved but notifications failed:", error);
  }
}

export async function saveAnnouncementAction(formData: FormData): Promise<AnnouncementActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const id = text(formData, "id");
  const title = text(formData, "title");
  const body = text(formData, "body");
  const priority = text(formData, "priority") as AnnouncementPriority;
  const audience = text(formData, "audience_type") as AnnouncementAudience;
  const status = text(formData, "status") as AnnouncementStatus;
  const publishAt = iso(text(formData, "publish_at"));
  const expiresAt = iso(text(formData, "expires_at"));
  const isPinned = text(formData, "is_pinned") === "on";
  const selectedStudentIds = [...new Set(
    formData.getAll("student_ids").filter((value): value is string => typeof value === "string" && value.trim().length > 0)
  )];

  if (title.length < 2 || title.length > 180) return { ok: false, error: "Title must be between 2 and 180 characters." };
  if (body.length < 2 || body.length > 20000) return { ok: false, error: "Announcement message must be between 2 and 20,000 characters." };
  if (!["general", "course", "urgent"].includes(priority)) return { ok: false, error: "Invalid priority." };
  if (!["all_students", "programme", "intake", "course", "class", "students"].includes(audience)) {
    return { ok: false, error: "Invalid audience." };
  }
  if (!["draft", "published", "archived"].includes(status)) return { ok: false, error: "Invalid status." };
  if (expiresAt && publishAt && new Date(expiresAt).getTime() <= new Date(publishAt).getTime()) {
    return { ok: false, error: "Expiry must be after the publish time." };
  }
  if (expiresAt && !publishAt && new Date(expiresAt).getTime() <= Date.now()) {
    return { ok: false, error: "Expiry must be in the future." };
  }

  const targetKey: Record<Exclude<AnnouncementAudience, "all_students" | "students">, string> = {
    programme: "programme_id",
    intake: "intake_id",
    course: "course_id",
    class: "class_id",
  };
  const targetField = audience === "all_students" || audience === "students" ? null : targetKey[audience];
  const targetId = targetField ? text(formData, targetField) : null;
  if (targetField && !targetId) return { ok: false, error: "Choose who should receive this announcement." };
  if (audience === "students" && selectedStudentIds.length === 0) {
    return { ok: false, error: "Select at least one student." };
  }

  let current: any = null;
  if (id) {
    const { data, error } = await supabase
      .from("announcements")
      .select("id,published_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Announcement could not be found." };
    current = data;
  }

  const payload = {
    title,
    body,
    priority,
    audience_type: audience,
    programme_id: audience === "programme" ? targetId : null,
    intake_id: audience === "intake" ? targetId : null,
    course_id: audience === "course" ? targetId : null,
    class_id: audience === "class" ? targetId : null,
    status,
    publish_at: publishAt,
    expires_at: expiresAt,
    published_at: status === "published" ? (publishAt ?? current?.published_at ?? new Date().toISOString()) : current?.published_at ?? null,
    is_pinned: isPinned,
  };

  let announcementId = id;
  if (id) {
    const { error } = await supabase.from("announcements").update(payload).eq("id", id);
    if (error) {
      console.error("Unable to update announcement:", error.message);
      return { ok: false, error: "Unable to save the announcement." };
    }
  } else {
    const { data, error } = await supabase
      .from("announcements")
      .insert({ ...payload, created_by: admin.id })
      .select("id")
      .single();
    if (error || !data) {
      console.error("Unable to create announcement:", error?.message);
      return { ok: false, error: "Unable to create the announcement." };
    }
    announcementId = data.id;
  }

  const adminClient = createAdminClient();
  const { error: deleteRecipientError } = await adminClient
    .from("announcement_students")
    .delete()
    .eq("announcement_id", announcementId);
  if (deleteRecipientError) console.error("Unable to replace selected announcement students:", deleteRecipientError.message);

  if (audience === "students") {
    const { error: recipientError } = await adminClient.from("announcement_students").insert(
      selectedStudentIds.map((studentId) => ({ announcement_id: announcementId, student_id: studentId }))
    );
    if (recipientError) {
      console.error("Unable to save selected announcement students:", recipientError.message);
      return { ok: false, error: "Announcement saved, but selected students could not be assigned." };
    }
  }

  const effectiveAt = publishAt ? new Date(publishAt).getTime() : Date.now();
  const shouldNotify = status === "published" && effectiveAt <= Date.now() && (!expiresAt || new Date(expiresAt).getTime() > Date.now());
  await syncAnnouncementNotifications(announcementId, audience, targetId, title, body, priority, shouldNotify);

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "announcement.updated" : "announcement.created",
    entity_type: "announcement",
    entity_id: announcementId,
    metadata: { audience_type: audience, status, priority, publish_at: publishAt, expires_at: expiresAt },
  });

  revalidateAnnouncementPaths(accessKey, announcementId);
  return { ok: true };
}
