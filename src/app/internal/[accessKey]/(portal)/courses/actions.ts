"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";

export type CourseActionState = {
  ok: boolean;
  error?: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function saveCourseAction(formData: FormData): Promise<CourseActionState> {
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
  const title = text(formData, "title");
  const requestedSlug = text(formData, "slug");
  const slug = slugify(requestedSlug || title);
  const status = text(formData, "status");

  if (title.length < 2) return { ok: false, error: "Course title is required." };
  if (!slug) return { ok: false, error: "A valid course slug is required." };
  if (!["draft", "published", "archived"].includes(status)) {
    return { ok: false, error: "Invalid publication status." };
  }

  const payload = {
    title,
    slug,
    short_description: nullableText(formData, "short_description"),
    description: nullableText(formData, "description"),
    thumbnail_url: nullableText(formData, "thumbnail_url"),
    category: nullableText(formData, "category"),
    level: nullableText(formData, "level"),
    duration_text: nullableText(formData, "duration_text"),
    status: status as "draft" | "published" | "archived",
    is_public: formData.get("is_public") === "on",
  };

  const query = id
    ? supabase.from("courses").update(payload).eq("id", id).select("id").single()
    : supabase.from("courses").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That course slug is already in use." };
    console.error("Unable to save course:", error);
    return { ok: false, error: "Unable to save the course." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "course.updated" : "course.created",
    entity_type: "course",
    entity_id: data.id,
    metadata: { title, status: payload.status, is_public: payload.is_public },
  });

  revalidatePath(`/internal/${accessKey}/courses`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);

  return { ok: true };
}
