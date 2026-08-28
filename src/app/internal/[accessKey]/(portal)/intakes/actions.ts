"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";

export type IntakeActionState = { ok: boolean; error?: string };

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

export async function saveIntakeAction(formData: FormData): Promise<IntakeActionState> {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { ok: false, error: "Invalid admin route." };

  const admin = await requireRealAdmin();
  if (!admin) return { ok: false, error: "Demo/preview mode is read-only. Sign in with a real admin account." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const id = text(formData, "id");
  const programmeId = text(formData, "programme_id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const status = text(formData, "status");
  const capacityRaw = text(formData, "capacity");
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (!programmeId) return { ok: false, error: "Select a programme." };
  if (name.length < 2) return { ok: false, error: "Intake name is required." };
  if (!slug) return { ok: false, error: "A valid intake slug is required." };
  if (!["draft", "upcoming", "open", "closing_soon", "full", "active", "completed", "closed"].includes(status)) {
    return { ok: false, error: "Invalid intake status." };
  }
  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
    return { ok: false, error: "Capacity must be a positive whole number." };
  }

  const payload = {
    programme_id: programmeId,
    name,
    slug,
    start_date: nullableText(formData, "start_date"),
    end_date: nullableText(formData, "end_date"),
    registration_open_at: nullableText(formData, "registration_open_at"),
    registration_close_at: nullableText(formData, "registration_close_at"),
    capacity,
    status: status as "draft" | "upcoming" | "open" | "closing_soon" | "full" | "active" | "completed" | "closed",
  };

  const query = id
    ? supabase.from("intakes").update(payload).eq("id", id).select("id").single()
    : supabase.from("intakes").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That intake slug is already in use." };
    console.error("Unable to save intake:", error);
    return { ok: false, error: "Unable to save the intake." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: id ? "intake.updated" : "intake.created",
    entity_type: "intake",
    entity_id: data.id,
    metadata: { name, programme_id: programmeId, status },
  });

  revalidatePath(`/internal/${accessKey}/intakes`);
  revalidatePath("/intakes");
  return { ok: true };
}
