import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export type PlatformRole = "student" | "instructor" | "staff" | "admin" | "super_admin";

function isLocalUiBypass() {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
}

export async function getCurrentIdentity() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "active") return null;

  const { data: rows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  if (roleError || !rows?.length) return null;

  const roles = rows.map((row) => row.role as PlatformRole);
  return { id: data.user.id, roles };
}

export async function hasRealStudentSession() {
  const identity = await getCurrentIdentity();
  return Boolean(identity?.roles.includes("student"));
}

export async function hasRealInstructorSession() {
  const identity = await getCurrentIdentity();
  return Boolean(identity?.roles.includes("instructor"));
}

export async function requireStudent() {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["student"] as PlatformRole[] };

  const identity = await getCurrentIdentity();
  if (identity) {
    if (!identity.roles.includes("student")) redirect("/");
    return identity;
  }

  if (await hasValidDemoSession()) {
    return { id: "demo-preview", roles: ["student"] as PlatformRole[] };
  }

  redirect("/login");
}

export async function requireAdmin(loginPath: string) {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["super_admin"] as PlatformRole[] };

  const identity = await getCurrentIdentity();
  if (identity) {
    if (!identity.roles.some((role) => role === "admin" || role === "super_admin")) redirect("/");
    return identity;
  }

  if (isAdminDemoEnabled() && (await hasValidDemoSession())) {
    return { id: "demo-preview", roles: ["super_admin"] as PlatformRole[] };
  }

  redirect(loginPath);
}

export async function requireRealAdmin() {
  const identity = await getCurrentIdentity();
  if (!identity) return null;
  if (!identity.roles.some((role) => role === "admin" || role === "super_admin")) return null;
  return identity;
}

export async function requireAdministrationAccess(loginPath: string) {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["super_admin"] as PlatformRole[] };

  const identity = await getCurrentIdentity();
  if (identity) {
    const allowed = identity.roles.some(
      (role) => role === "staff" || role === "admin" || role === "super_admin"
    );
    if (!allowed) redirect("/");
    return identity;
  }

  if (isAdminDemoEnabled() && (await hasValidDemoSession())) {
    return { id: "demo-preview", roles: ["super_admin"] as PlatformRole[] };
  }

  redirect(loginPath);
}

export async function requireRealAdministrationActor() {
  const identity = await getCurrentIdentity();
  if (!identity) return null;
  const allowed = identity.roles.some(
    (role) => role === "staff" || role === "admin" || role === "super_admin"
  );
  return allowed ? identity : null;
}

export async function requireRealSuperAdmin() {
  const identity = await getCurrentIdentity();
  if (!identity?.roles.includes("super_admin")) return null;
  return identity;
}

export async function requireInternalAccess(loginPath: string) {
  if (isLocalUiBypass()) return { id: "local-ui-preview", roles: ["super_admin"] as PlatformRole[] };

  const identity = await getCurrentIdentity();
  if (identity) {
    const allowed = identity.roles.some(
      (role) => role === "staff" || role === "instructor" || role === "admin" || role === "super_admin"
    );
    if (!allowed) redirect("/");
    return identity;
  }

  if (isAdminDemoEnabled() && (await hasValidDemoSession())) {
    return { id: "demo-preview", roles: ["super_admin"] as PlatformRole[] };
  }

  redirect(loginPath);
}

export async function requireInstructorPortal(loginPath: string) {
  const identity = await requireInternalAccess(loginPath);

  const allowed = identity.roles.some(
    (role) => role === "instructor" || role === "super_admin"
  );
  if (!allowed) redirect("/");
  return identity;
}

export async function requireRealInstructorPortalActor() {
  const identity = await getCurrentIdentity();
  if (!identity) return null;

  const allowed = identity.roles.some(
    (role) => role === "instructor" || role === "super_admin"
  );
  return allowed ? identity : null;
}
