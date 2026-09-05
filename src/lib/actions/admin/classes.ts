"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createClient } from "@/lib/supabase/server";

export type ClassActionState = {
  ok: boolean;
  error?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? value : null;
}

export async function saveClassAction(formData: FormData): Promise<ClassActionState> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const admin = await requireRealAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "Demo/preview mode is read-only. Sign in with a real admin account to save changes.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const id = text(formData, "id");
  const intakeId = text(formData, "intake_id");
  const courseId = text(formData, "course_id");
  const instructorId = nullableText(formData, "instructor_id");
  const name = text(formData, "name");
  const startDate = nullableText(formData, "start_date");
  const endDate = nullableText(formData, "end_date");
  const status = text(formData, "status");

  if (!intakeId || !courseId || name.length < 2) {
    return { ok: false, error: "Intake, course and class name are required." };
  }
  if (!['draft', 'scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
    return { ok: false, error: "Invalid class status." };
  }
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "End date cannot be before the start date." };
  }

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("programme_id")
    .eq("id", intakeId)
    .maybeSingle();

  if (intakeError || !intake) return { ok: false, error: "The selected intake could not be found." };

  const { data: programmeCourse, error: linkError } = await supabase
    .from("programme_courses")
    .select("course_id")
    .eq("programme_id", intake.programme_id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (linkError || !programmeCourse) {
    return { ok: false, error: "That course is not part of the selected intake's programme." };
  }

  if (instructorId) {
    const { data: instructor, error: instructorError } = await supabase
      .from("instructor_profiles")
      .select("profile_id")
      .eq("profile_id", instructorId)
      .maybeSingle();
    if (instructorError || !instructor) return { ok: false, error: "The selected lecturer could not be found." };
  }

  const payload = {
    intake_id: intakeId,
    course_id: courseId,
    instructor_id: instructorId,
    name,
    start_date: startDate,
    end_date: endDate,
    status: status as "draft" | "scheduled" | "active" | "completed" | "cancelled",
  };

  const query = id
    ? supabase.from("classes").update(payload).eq("id", id).select("id").single()
    : supabase.from("classes").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    console.error("Unable to save class:", error);
    return { ok: false, error: "Unable to save the class." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "class.updated" : "class.created",
    entity_type: "class",
    entity_id: data.id,
    metadata: { intake_id: intakeId, course_id: courseId, instructor_id: instructorId, status },
  });

  revalidatePath(`/internal/${accessKey}/lms/classes`);
  revalidatePath("/student/courses");
  return { ok: true };
}
