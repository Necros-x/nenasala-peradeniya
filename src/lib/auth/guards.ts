import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export type PlatformRole = "student" | "instructor" | "staff" | "admin" | "super_admin";

function isLocalUiBypass() {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
}

async function getVerifiedIdentity() {
  const supabase = await createClient();
  if (!supabase) return null;

  // getUser() validates the JWT with Supabase rather than trusting cookie contents.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // Roles now come from the database rather than user-editable metadata.
  const { data: rows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  if (roleError || !rows?.length) return null;

  const roles = rows.map((row) => row.role as PlatformRole);
  return { id: data.user.id, roles };
}

export async function hasRealStudentSession() {
  const identity = await getVerifiedIdentity();
  return Boolean(identity?.roles.includes("student"));
}

export async function hasRealInstructorSession() {
  const identity = await getVerifiedIdentity();
  return Boolean(identity?.roles.includes("instructor"));
}

export async function requireInstructor() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/login");
  if (!identity.roles.includes("instructor")) redirect("/");
  return identity;
}

export async function requireRealInstructor() {
  const identity = await getVerifiedIdentity();
  if (!identity) return null;
  if (!identity.roles.includes("instructor")) return null;
  return identity;
}

export async function requireStudent() {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["student"] as PlatformRole[] };
  if (await hasValidDemoSession()) return { id: "demo-preview", roles: ["student"] as PlatformRole[] };

  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/login");
  if (!identity.roles.includes("student")) redirect("/");
  return identity;
}

export async function requireAdmin(loginPath: string) {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["super_admin"] as PlatformRole[] };
  if (isAdminDemoEnabled() && (await hasValidDemoSession())) {
    return { id: "demo-preview", roles: ["super_admin"] as PlatformRole[] };
  }

  const identity = await getVerifiedIdentity();
  if (!identity) redirect(loginPath);
  if (!identity.roles.some((role) => role === "admin" || role === "super_admin")) redirect("/");
  return identity;
}

/**
 * Strict guard for mutations. Demo/local preview sessions never satisfy this.
 * This prevents a UI bypass from becoming a database-write bypass.
 */
export async function requireRealAdmin() {
  const identity = await getVerifiedIdentity();
  if (!identity) return null;
  if (!identity.roles.some((role) => role === "admin" || role === "super_admin")) return null;
  return identity;
}
