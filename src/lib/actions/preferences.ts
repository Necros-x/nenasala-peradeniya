"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/lib/services/preferences";

function validTheme(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

async function currentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}


export async function loadThemePreferenceAction() {
  const ctx = await currentUser();
  if (!ctx) return { signedIn: false, themePreference: "system" as ThemePreference };

  const { data, error } = await ctx.supabase
    .from("user_preferences")
    .select("theme_preference")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (error) console.error("Unable to load theme preference:", error.message);
  const rawPreference = data?.theme_preference;
  const preference = validTheme(rawPreference) ? rawPreference : "system";
  return { signedIn: true, themePreference: preference };
}

export async function saveThemePreferenceAction(theme: ThemePreference) {
  if (!validTheme(theme)) return { ok: false, saved: false };
  const ctx = await currentUser();
  if (!ctx) return { ok: true, saved: false };

  const { error } = await ctx.supabase.from("user_preferences").upsert({
    user_id: ctx.user.id,
    theme_preference: theme,
  }, { onConflict: "user_id" });

  if (error) {
    console.error("Unable to save theme preference:", error.message);
    return { ok: false, saved: false };
  }

  revalidatePath("/student/settings");
  return { ok: true, saved: true };
}

export async function saveStudentPreferencesAction(formData: FormData) {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Please sign in again." };

  const rawTheme = String(formData.get("theme_preference") ?? "system");
  if (!validTheme(rawTheme)) return { ok: false, error: "Choose a valid appearance preference." };

  const { error } = await ctx.supabase.from("user_preferences").upsert({
    user_id: ctx.user.id,
    theme_preference: rawTheme,
    email_announcements: checked(formData, "email_announcements"),
    email_assignments: checked(formData, "email_assignments"),
    email_quizzes: checked(formData, "email_quizzes"),
    email_live_sessions: checked(formData, "email_live_sessions"),
    email_course_updates: checked(formData, "email_course_updates"),
    email_certificates: checked(formData, "email_certificates"),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("Unable to update student preferences:", error.message);
    return { ok: false, error: "Unable to update your settings." };
  }

  revalidatePath("/student/settings");
  return { ok: true };
}

export async function saveStudentSettingsAction(formData: FormData) {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Please sign in again." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const rawTheme = String(formData.get("theme_preference") ?? "system");

  if (fullName.length < 2 || fullName.length > 120) {
    return { ok: false, error: "Full name must be between 2 and 120 characters." };
  }
  if (phone.length > 40) return { ok: false, error: "Phone number is too long." };
  if (!validTheme(rawTheme)) return { ok: false, error: "Choose a valid appearance preference." };

  const { error: profileError } = await ctx.supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", ctx.user.id);

  if (profileError) {
    console.error("Unable to update profile settings:", profileError.message);
    return { ok: false, error: "Unable to update your profile." };
  }

  const { error: preferenceError } = await ctx.supabase.from("user_preferences").upsert({
    user_id: ctx.user.id,
    theme_preference: rawTheme,
    email_announcements: checked(formData, "email_announcements"),
    email_assignments: checked(formData, "email_assignments"),
    email_quizzes: checked(formData, "email_quizzes"),
    email_live_sessions: checked(formData, "email_live_sessions"),
    email_course_updates: checked(formData, "email_course_updates"),
    email_certificates: checked(formData, "email_certificates"),
  }, { onConflict: "user_id" });

  if (preferenceError) {
    console.error("Unable to update notification preferences:", preferenceError.message);
    return { ok: false, error: "Your profile was saved, but notification preferences could not be updated." };
  }

  revalidatePath("/student/settings");
  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { ok: true };
}
