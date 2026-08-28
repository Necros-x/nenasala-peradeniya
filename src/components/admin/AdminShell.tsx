"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  GraduationCap,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ClipboardList,
  FileQuestion,
  Megaphone,
  Award,
  MessagesSquare,
  UserPlus,
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

const navGroups = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "PEOPLE",
    items: [
      { label: "Students", path: "/students", icon: Users },
      { label: "Instructors", path: "/instructors", icon: Briefcase },
      { label: "Staff & Admin", path: "/staff", icon: UserPlus },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      { label: "Programmes & Courses", path: "/courses", icon: BookOpen },
      { label: "Intakes", path: "/intakes", icon: GraduationCap },
    ],
  },
  {
    title: "SYSTEM",
    items: [{ label: "Settings", path: "/settings", icon: Settings }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <>
      <div className="h-20 flex items-center px-5 border-b border-border">
        <Link to="/" onClick={onNavigate} className="flex items-center min-w-0">
          <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-10 w-auto max-w-[170px] object-contain" />
          <span className="sr-only">Nenasala Admin Portal</span>
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

      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-bold tracking-[0.16em] text-text-muted">{group.title}</p>
            {group.items.map((item) => {
              const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = useParams<{ accessKey: string }>();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    return () => document.documentElement.classList.remove("dark");
  }, [isDark]);

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
        <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-[var(--color-static-black)]/35 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-surface flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col bg-surface border-r border-border shadow-2xl transition-transform lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button aria-label="Close menu" className="absolute right-3 top-3 p-2 rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-muted" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/90 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden md:block w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input placeholder="Search students, courses, intakes..." className="pl-9 bg-background border-border rounded-[var(--radius-sm)]" />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setIsDark((value) => !value)} aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-primary" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 rounded-[var(--radius-sm)] px-2.5 gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[var(--color-primary-soft)] text-brand-primary font-bold text-xs">AP</span>
                  <span className="hidden sm:inline text-sm">Admin</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut} className="text-danger">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
