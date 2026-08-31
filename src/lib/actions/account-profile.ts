"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveOwnProfileAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Account services are unavailable." };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return { ok: false, error: "Please sign in again." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return { ok: false, error: "Full name must be between 2 and 120 characters." };
  }
  if (phone.length > 40) return { ok: false, error: "Phone number is too long." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Unable to update own profile:", error.message);
    return { ok: false, error: "Unable to update your profile." };
  }

  revalidatePath("/student/profile");
  revalidatePath("/student/settings");
  revalidatePath("/student/dashboard");

  return { ok: true, fullName, phone };
}
