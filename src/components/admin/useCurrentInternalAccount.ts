"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AccountRole } from "@/lib/types/account";

export type InternalHeaderAccount = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  roles: AccountRole[];
};

function validRole(value: unknown): value is AccountRole {
  return value === "student" || value === "instructor" || value === "staff" || value === "admin" || value === "super_admin";
}

export function internalRoleLabel(roles: AccountRole[]) {
  if (roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("admin")) return "Admin";
  if (roles.includes("staff")) return "Staff";
  if (roles.includes("instructor")) return "Lecturer";
  return "Internal User";
}

export function useCurrentInternalAccount(knownRoles?: AccountRole[]) {
  const [account, setAccount] = useState<InternalHeaderAccount | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name,email,phone,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) return;

      let roles = knownRoles ? [...knownRoles] : [];
      if (!knownRoles) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        roles = (roleRows ?? [])
          .map((row: { role: unknown }) => row.role)
          .filter(validRole);
      }

      setAccount({
        fullName: profile.full_name ?? "Nenasala User",
        email: profile.email ?? user.email ?? "",
        phone: profile.phone ?? "",
        avatarUrl: profile.avatar_url ?? null,
        roles,
      });
    } catch {
      // Keep the role-based fallback visible if profile loading fails.
    }
  }, [knownRoles]);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    window.addEventListener("nenasala:profile-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("nenasala:profile-updated", refresh);
    };
  }, [load]);

  return account;
}
