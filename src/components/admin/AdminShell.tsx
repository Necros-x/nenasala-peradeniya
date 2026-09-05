"use client";

import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  GraduationCap,
  Settings,
  Search,
  LogOut,
  Menu,
  X,
  Award,
  UserPlus,
  ArrowLeft,
  MessageSquare,
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
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { AdminNotificationMenu } from "@/components/admin/AdminNotificationMenu";
import { internalRoleLabel, useCurrentInternalAccount } from "@/components/admin/useCurrentInternalAccount";

const navGroups = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "PEOPLE",
    items: [
      { label: "Students", path: "/students", icon: Users },
      { label: "Lecturers", path: "/instructors", icon: Briefcase },
      { label: "Internal Accounts", path: "/staff", icon: UserPlus },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      { label: "Programmes & Courses", path: "/courses", icon: BookOpen },
      { label: "Intakes", path: "/intakes", icon: GraduationCap },
      { label: "Certificates", path: "/certificates", icon: Award },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [{ label: "Messages", path: "/messages", icon: MessageSquare }],
  },
  {
    title: "SYSTEM",
    items: [{ label: "Settings", path: "/settings", icon: Settings }],
  },
];

type ShellRole = "student" | "instructor" | "staff" | "admin" | "super_admin";

function SidebarContent({
  onNavigate,
  staffOnly,
}: {
  onNavigate?: () => void;
  staffOnly: boolean;
}) {
  const location = useLocation();
  const visibleGroups = staffOnly
    ? navGroups.filter((group) => group.title === "COMMUNICATION")
    : navGroups;

  return (
    <>
      <div className="h-20 flex items-center px-5 border-b border-border">
        <Link to="/" onClick={onNavigate} className="flex items-center min-w-0">
          <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-10 w-auto max-w-[170px] object-contain" />
          <span className="sr-only">Nenasala Internal Portal</span>
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
        {visibleGroups.map((group) => (
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

export function AdminShell({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: ShellRole[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = useParams<{ accessKey: string }>();
  const router = useRouter();
  const roleSet = new Set(roles);
  const staffOnly = roleSet.has("staff") && !roleSet.has("admin") && !roleSet.has("super_admin");
  const fallbackRoleLabel = staffOnly ? "Staff" : roleSet.has("super_admin") ? "Super Admin" : "Admin";
  const account = useCurrentInternalAccount(roles);
  const accountName = account?.fullName ?? fallbackRoleLabel;
  const accountRole = account ? internalRoleLabel(account.roles) : fallbackRoleLabel;

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
        <SidebarContent staffOnly={staffOnly} />
      </aside>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col bg-surface border-r border-border shadow-2xl transition-transform lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button aria-label="Close menu" className="absolute right-3 top-3 p-2 rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-muted" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
        <SidebarContent staffOnly={staffOnly} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/90 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {!staffOnly && (
            <div className="relative hidden md:block w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input placeholder="Search students, courses, intakes..." className="pl-9 bg-background border-border rounded-[var(--radius-sm)]" />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeMenu />
            <AdminNotificationMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 rounded-[var(--radius-sm)] px-2.5 gap-2">
                  <AccountAvatar name={accountName} avatarUrl={account?.avatarUrl} className="h-7 w-7" textClassName="text-[10px]" />
                  <span className="hidden max-w-36 truncate sm:inline text-sm">{accountName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm text-foreground">{accountName}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-text-muted">{account?.email || accountRole}</span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-primary">{accountRole}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                {!staffOnly && <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>}
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
