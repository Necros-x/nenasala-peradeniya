import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRealAdmin } from "@/lib/auth/guards";

export type InternalUserRole = "staff" | "admin" | "super_admin";

export type InternalUserRecord = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "suspended";
  role: InternalUserRole;
  created_at: string;
};

const roleRank: Record<InternalUserRole, number> = {
  staff: 1,
  admin: 2,
  super_admin: 3,
};

export async function getInternalUsers(): Promise<InternalUserRecord[]> {
  const actor = await requireRealAdmin();
  if (!actor) return [];

  const admin = createAdminClient();
  const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("user_id,role")
    .in("role", ["staff", "admin", "super_admin"]);

  if (roleError) {
    console.error("Unable to load internal roles:", roleError.message);
    return [];
  }

  const rolesByUser = new Map<string, InternalUserRole>();
  for (const row of roleRows ?? []) {
    const role = row.role as InternalUserRole;
    const existing = rolesByUser.get(row.user_id);
    if (!existing || roleRank[role] > roleRank[existing]) {
      rolesByUser.set(row.user_id, role);
    }
  }

  const ids = [...rolesByUser.keys()];
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id,full_name,email,phone,status,created_at")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (profileError) {
    console.error("Unable to load internal profiles:", profileError.message);
    return [];
  }

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name ?? "Internal user",
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      status: profile.status as InternalUserRecord["status"],
      role: rolesByUser.get(profile.id) ?? "staff",
      created_at: profile.created_at,
    }))
    .sort((a, b) => {
      const roleDifference = roleRank[b.role] - roleRank[a.role];
      if (roleDifference !== 0) return roleDifference;
      return a.full_name.localeCompare(b.full_name);
    });
}
