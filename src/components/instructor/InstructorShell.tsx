"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
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
import type { InstructorProfileRecord } from "@/lib/services/instructor-portal";

const nav = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instructor/classes", label: "My Classes", icon: UsersRound },
  { href: "/instructor/content", label: "Course Content", icon: BookOpen },
  { href: "/instructor/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/instructor/quizzes", label: "Quiz Results", icon: FileQuestion },
  { href: "/instructor/recordings", label: "Recordings", icon: PlayCircle },
  { href: "/instructor/announcements", label: "Announcements", icon: Megaphone },
  { href: "/instructor/progress", label: "Student Progress", icon: BarChart3 },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "IN";
}

export default function InstructorShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: InstructorProfileRecord;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out.");
    }
  }

  const sidebar = (
    <>
      <div className="flex h-20 items-center border-b border-border px-5">
        <Link href="/instructor/dashboard" onClick={() => setMobileOpen(false)}>
          <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-10 w-auto max-w-[170px] object-contain" />
        </Link>
      </div>
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">Lecturer Portal</p>
        <p className="mt-1 truncate text-sm font-semibold text-text-primary">{profile.full_name}</p>
        <p className="truncate text-xs text-text-muted">{profile.professional_title ?? "Instructor"}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-primary text-[var(--color-static-white)]"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
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
            <p className="text-sm font-bold text-text-primary">Lecturer Workspace</p>
            <p className="hidden text-xs text-text-muted sm:block">Only your assigned classes and students are shown.</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeMenu />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 sm:flex">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-brand-primary">
                  {initials(profile.full_name)}
                </span>
              )}
              <span className="max-w-36 truncate text-xs font-semibold text-text-primary">{profile.full_name}</span>
            </div>
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
