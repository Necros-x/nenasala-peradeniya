import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export type PlatformRole = "student" | "instructor" | "admin" | "super_admin";

function isLocalUiBypass() {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
}

async function getVerifiedIdentity() {
  const supabase = await createClient();
  if (!supabase) return null;

  // getUser() validates the JWT with Supabase rather than trusting local cookie contents.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // app_metadata is server-controlled. Do not authorize from user_metadata.
  const role = data.user.app_metadata?.role as PlatformRole | undefined;
  if (!role) return null;
  return { id: data.user.id, role };
}

export async function requireStudent() {
  if (isLocalUiBypass()) return { id: "local-ui-preview", role: "student" as const };
  if (await hasValidDemoSession()) return { id: "demo-preview", role: "student" as const };

  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/login");
  if (identity.role !== "student") redirect("/");
  return identity;
}

export async function requireAdmin(loginPath: string) {
  if (isLocalUiBypass()) return { id: "local-ui-preview", role: "super_admin" as const };
  if (isAdminDemoEnabled() && (await hasValidDemoSession())) {
    return { id: "demo-preview", role: "super_admin" as const };
  }

  const identity = await getVerifiedIdentity();
  if (!identity) redirect(loginPath);
  if (identity.role !== "admin" && identity.role !== "super_admin") redirect("/");
  return identity;
}
