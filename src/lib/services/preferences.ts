import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ThemePreference = "system" | "light" | "dark";

export type UserPreferences = {
  themePreference: ThemePreference;
  emailAnnouncements: boolean;
  emailAssignments: boolean;
  emailQuizzes: boolean;
  emailLiveSessions: boolean;
  emailCourseUpdates: boolean;
  emailCertificates: boolean;
};

export type CurrentThemePreference = {
  signedIn: boolean;
  themePreference: ThemePreference;
};

export type CurrentStudentSettings = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themePreference: "system",
  emailAnnouncements: true,
  emailAssignments: true,
  emailQuizzes: true,
  emailLiveSessions: true,
  emailCourseUpdates: true,
  emailCertificates: true,
};

function themePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function mapPreferences(row: any): UserPreferences {
  return {
    themePreference: themePreference(row?.theme_preference),
    emailAnnouncements: row?.email_announcements !== false,
    emailAssignments: row?.email_assignments !== false,
    emailQuizzes: row?.email_quizzes !== false,
    emailLiveSessions: row?.email_live_sessions !== false,
    emailCourseUpdates: row?.email_course_updates !== false,
    emailCertificates: row?.email_certificates !== false,
  };
}

export async function getCurrentThemePreference(): Promise<CurrentThemePreference> {
  const supabase = await createClient();
  if (!supabase) return { signedIn: false, themePreference: "system" };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return { signedIn: false, themePreference: "system" };

  const { data, error } = await supabase
    .from("user_preferences")
    .select("theme_preference")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) console.error("Unable to load theme preference:", error.message);
  return {
    signedIn: true,
    themePreference: themePreference(data?.theme_preference),
  };
}

export async function getCurrentStudentSettings(): Promise<CurrentStudentSettings | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return null;

  const [profileResult, preferencesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,phone,avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select("theme_preference,email_announcements,email_assignments,email_quizzes,email_live_sessions,email_course_updates,email_certificates")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    console.error("Unable to load student settings profile:", profileResult.error.message);
    return null;
  }
  if (!profileResult.data) return null;
  if (preferencesResult.error) {
    console.error("Unable to load student preferences:", preferencesResult.error.message);
  }

  return {
    fullName: profileResult.data.full_name ?? "",
    email: profileResult.data.email ?? user.email ?? "",
    phone: profileResult.data.phone ?? "",
    avatarUrl: profileResult.data.avatar_url ?? null,
    preferences: preferencesResult.data
      ? mapPreferences(preferencesResult.data)
      : { ...DEFAULT_USER_PREFERENCES },
  };
}
