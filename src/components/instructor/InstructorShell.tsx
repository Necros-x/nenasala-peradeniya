"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PlayCircle,
  UsersRound,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import type { InstructorProfileRecord } from "@/lib/services/instructor-portal";

const nav = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { segment: "classes", label: "My Classes", icon: UsersRound },
  { segment: "content", label: "Course Content", icon: BookOpen },
  { segment: "materials", label: "Course Materials", icon: FolderOpen },
  { segment: "assignments", label: "Assignments", icon: ClipboardCheck },
  { segment: "quizzes", label: "Quiz Results", icon: FileQuestion },
  { segment: "recordings", label: "Live & Recordings", icon: PlayCircle },
  { segment: "announcements", label: "Announcements", icon: Megaphone },
  { segment: "progress", label: "Student Progress", icon: BarChart3 },
];

export default function InstructorShell({
  children,
  profile,
  basePath,
  loginPath,
  controlCenterPath,
  globalView = false,
}: {
  children: React.ReactNode;
  profile: InstructorProfileRecord;
  basePath: string;
  loginPath: string;
  controlCenterPath: string;
  globalView?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace(loginPath);
      router.refresh();
    } catch {
      toast.error("Unable to sign out.");
    }
  }

  const sidebar = (
    <>
      <div className="flex h-20 items-center border-b border-border px-5">
        <Link href={`${basePath}/dashboard`} onClick={() => setMobileOpen(false)}>
          <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-10 w-auto max-w-[170px] object-contain" />
        </Link>
      </div>

      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">Instructor Portal</p>
        <p className="mt-1 truncate text-sm font-semibold text-text-primary">{profile.full_name}</p>
        <p className="truncate text-xs text-text-muted">{profile.professional_title ?? "Instructor"}</p>
      </div>

      <div className="border-b border-border px-3 py-3">
        <Link
          href={controlCenterPath}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Control Center
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {nav.map((item) => {
          const href = `${basePath}/${item.segment}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.segment}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-primary text-[var(--color-static-white)]"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {globalView && item.segment === "classes" ? "All Classes" : item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[var(--color-static-black)]/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {sidebar}
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-border bg-surface shadow-2xl transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button
          type="button"
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-md p-2 text-text-secondary hover:bg-surface-muted"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-xl md:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-md text-text-primary hover:bg-surface-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-sm font-bold text-text-primary">Instructor Workspace</p>
            <p className="hidden text-xs text-text-muted sm:block">
              {globalView
                ? "Super Admin view of all instructor-side data."
                : "Only your assigned classes and students are shown."}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeMenu />
            <Link
              href={`${basePath}/profile`}
              className="hidden items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 transition-colors hover:bg-surface-muted sm:flex"
              title="Open profile"
            >
              <AccountAvatar name={profile.full_name} avatarUrl={profile.avatar_url} className="h-8 w-8" />
              <span className="max-w-36 truncate text-xs font-semibold text-text-primary">{profile.full_name}</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1450px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
