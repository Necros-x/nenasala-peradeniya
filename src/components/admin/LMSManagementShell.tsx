"use client";

import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Video,
  BookOpen,
  PenTool,
  CheckSquare,
  PlayCircle,
  MessageSquare,
  ClipboardList,
  Search,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/features/admin/components/ui/button";
import { Input } from "@/features/admin/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/admin/components/ui/dropdown-menu";
import { cn } from "@/features/admin/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeMenu } from "@/components/theme/ThemeMenu";

const navGroups = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/lms", icon: LayoutDashboard },
      { label: "Students", path: "/lms/students", icon: Users },
    ],
  },
  {
    title: "LEARNING",
    items: [
      { label: "Classes", path: "/lms/classes", icon: Video },
      { label: "Course Content", path: "/lms/content", icon: BookOpen },
      { label: "Assignments", path: "/lms/assignments", icon: PenTool },
      { label: "Quizzes", path: "/lms/quizzes", icon: CheckSquare },
      { label: "Recordings", path: "/lms/recordings", icon: PlayCircle },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [{ label: "Announcements", path: "/lms/announcements", icon: MessageSquare }],
  },
  {
    title: "PERFORMANCE",
    items: [{ label: "Progress & Grades", path: "/lms/progress", icon: ClipboardList }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <>
      <div className="flex h-20 items-center border-b border-border px-5">
        <Link to="/" onClick={onNavigate} className="flex min-w-0 items-center">
          <img
            src="/brand/nenasala-logo.png"
            alt="Nenasala"
            className="h-10 w-auto max-w-[170px] object-contain"
          />
          <span className="sr-only">Nenasala LMS Management</span>
        </Link>
      </div>

      <div className="border-b border-border px-3 py-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Control Center
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.16em] text-text-muted">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/lms" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-primary text-[var(--color-static-white)] shadow-sm"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export function LMSManagementShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = useParams<{ accessKey: string }>();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace(`/internal/${params.accessKey}/login`);
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Supabase may not be configured yet.");
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[var(--color-static-black)]/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent />
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-border bg-surface shadow-2xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-[var(--radius-sm)] p-2 text-text-secondary hover:bg-surface-muted"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-xl md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search courses, classes, assignments..."
              className="rounded-[var(--radius-sm)] border-border bg-background pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="mr-2 hidden text-right xl:block">
              <p className="text-xs font-semibold text-text-primary">LMS Management</p>
              <p className="text-[10px] text-text-muted">Learning operations workspace</p>
            </div>

            <ThemeMenu />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 rounded-[var(--radius-sm)] px-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[var(--color-primary-soft)] text-xs font-bold text-brand-primary">
                    AP
                  </span>
                  <span className="hidden text-sm sm:inline">Admin</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>LMS Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/">Control Center</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut} className="text-danger">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
