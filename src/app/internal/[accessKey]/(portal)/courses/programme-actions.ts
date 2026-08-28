"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";

export type ProgrammeActionState = { ok: boolean; error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function saveProgrammeAction(formData: FormData): Promise<ProgrammeActionState> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const admin = await requireRealAdmin();
  if (!admin) return { ok: false, error: "Demo/preview mode is read-only. Sign in with a real admin account." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const status = text(formData, "status");
  const courseIds = formData.getAll("course_ids").filter((value): value is string => typeof value === "string" && value.length > 0);

  if (name.length < 2) return { ok: false, error: "Programme name is required." };
  if (!slug) return { ok: false, error: "A valid programme slug is required." };
  if (!["draft", "published", "archived"].includes(status)) return { ok: false, error: "Invalid publication status." };

  const payload = {
    name,
    slug,
    short_description: nullableText(formData, "short_description"),
    description: nullableText(formData, "description"),
    thumbnail_url: nullableText(formData, "thumbnail_url"),
    duration_text: nullableText(formData, "duration_text"),
    status: status as "draft" | "published" | "archived",
    is_featured: formData.get("is_featured") === "on",
  };

  const query = id
    ? supabase.from("programmes").update(payload).eq("id", id).select("id").single()
    : supabase.from("programmes").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That programme slug is already in use." };
    console.error("Unable to save programme:", error);
    return { ok: false, error: "Unable to save the programme." };
  }

  const programmeId = data.id;
  const { error: deleteError } = await supabase.from("programme_courses").delete().eq("programme_id", programmeId);
  if (deleteError) return { ok: false, error: "Programme saved, but course links could not be updated." };

  if (courseIds.length) {
    const { error: linkError } = await supabase.from("programme_courses").insert(
      courseIds.map((courseId, position) => ({ programme_id: programmeId, course_id: courseId, position, is_required: true })),
    );
    if (linkError) return { ok: false, error: "Programme saved, but course links could not be updated." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "programme.updated" : "programme.created",
    entity_type: "programme",
    entity_id: programmeId,
    metadata: { name, status, course_count: courseIds.length },
  });

  revalidatePath(`/internal/${accessKey}/courses`);
  revalidatePath("/courses");
  revalidatePath("/intakes");
  return { ok: true };
}
