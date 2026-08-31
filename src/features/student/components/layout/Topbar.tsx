"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { GlobalSearch } from "../ui/GlobalSearch";
import { NotificationBell } from "../ui/NotificationBell";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMenuClick: () => void;
}

type StudentHeaderProfile = {
  fullName: string;
  avatarUrl: string | null;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [student, setStudent] = useState<StudentHeaderProfile | null>(null);

  const loadStudent = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setStudent({
          fullName: data.full_name ?? "Student",
          avatarUrl: data.avatar_url ?? null,
        });
      }
    } catch {
      // The rest of the student portal remains usable if the header profile cannot load.
    }
  }, []);

  useEffect(() => {
    void loadStudent();
    const refresh = () => void loadStudent();
    window.addEventListener("focus", refresh);
    window.addEventListener("nenasala:profile-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("nenasala:profile-updated", refresh);
    };
  }, [loadStudent]);

  const displayName = student?.fullName ?? "Student";

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeMenu />
        <NotificationBell />

        <Link to="/profile" className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-[var(--color-border)] hover:opacity-80 transition-opacity">
          <AccountAvatar name={displayName} avatarUrl={student?.avatarUrl} className="h-8 w-8" textClassName="text-[10px]" />
          <div className="hidden sm:block text-sm min-w-0">
            <div className="max-w-40 truncate font-medium text-[var(--color-text-primary)] leading-tight">{displayName}</div>
            <div className="text-[var(--color-text-muted)] text-xs">Student</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
