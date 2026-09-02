"use server";

import { revalidatePath } from "next/cache";
import { requireRealInstructorPortalActor } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverNotification } from "@/lib/notifications/deliver";

export type InstructorAnnouncementActionResult = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createInstructorAnnouncementAction(
  formData: FormData
): Promise<InstructorAnnouncementActionResult> {
  const actor = await requireRealInstructorPortalActor();
  if (!actor) return { ok: false, error: "Lecturer Portal access is required." };

  const isSuperAdmin = actor.roles.includes("super_admin");

  const classId = text(formData, "class_id");
  const title = text(formData, "title");
  const body = text(formData, "body");
  const priority = text(formData, "priority");

  if (!classId) return { ok: false, error: "Choose a class." };
  if (title.length < 2 || title.length > 180) return { ok: false, error: "Title must be between 2 and 180 characters." };
  if (body.length < 2 || body.length > 20000) return { ok: false, error: "Message must be between 2 and 20,000 characters." };
  if (!["general", "course", "urgent"].includes(priority)) return { ok: false, error: "Invalid announcement priority." };

  const admin = createAdminClient();

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id,intake_id,instructor_id,name,courses(title)")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classRow) return { ok: false, error: "Class could not be found." };

  if (!isSuperAdmin && classRow.instructor_id !== actor.id) {
    return { ok: false, error: "You can only publish announcements to classes assigned to you." };
  }

  const now = new Date().toISOString();

  const { data: announcement, error: insertError } = await admin
    .from("announcements")
    .insert({
      title,
      body,
      priority,
      audience_type: "class",
      class_id: classId,
      status: "published",
      publish_at: now,
      published_at: now,
      is_pinned: priority === "urgent",
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (insertError || !announcement) {
    console.error("Unable to publish instructor announcement:", insertError);
    return { ok: false, error: "Unable to publish the announcement." };
  }

  const { data: enrollments, error: enrollmentError } = await admin
    .from("enrollments")
    .select("student_id")
    .eq("intake_id", classRow.intake_id)
    .in("status", ["active", "paused"]);

  if (enrollmentError) {
    console.error("Announcement published but recipients could not be loaded:", enrollmentError.message);
  } else if (enrollments?.length) {
    const compact = body.replace(/\s+/g, " ").trim();
    const message = compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;

    await deliverNotification({
      userIds: enrollments.map((row) => row.student_id),
      title: priority === "urgent" ? `Urgent: ${title}` : title,
      message,
      type: "announcement",
      link: `/student/announcements/${announcement.id}`,
      sourceKey: `announcement:${announcement.id}`,
      emailCategory: "announcements",
      actionLabel: "Read announcement",
    });
  }

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: isSuperAdmin ? "announcement.created_by_super_admin_in_instructor_portal" : "announcement.created_by_instructor",
    entity_type: "announcement",
    entity_id: announcement.id,
    metadata: { class_id: classId, priority },
  });

  revalidatePath("/student/announcements");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/notifications");

  return { ok: true };
}
