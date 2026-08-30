"use client";

import { Link } from "react-router-dom";
import {
  Settings,
  BookOpen,
  BarChart3,
  Presentation,
  ArrowRight,
  Search,
  Bell,
} from "lucide-react";
import { Card } from "@/features/admin/components/ui/card";
type PlatformRole = "student" | "instructor" | "staff" | "admin" | "super_admin";

type Portal = {
  title: string;
  description: string;
  icon: typeof Settings;
  path: string;
  roles: PlatformRole[];
};

type AttentionData = {
  pendingEnrollments: number;
  ungradedSubmissions: number;
  unassignedClasses: number;
  closingIntakes: number;
  scheduledAnnouncements: number;
  total: number;
};

const portals: Portal[] = [
  {
    title: "ADMINISTRATION",
    description: "Users, programmes, payments, intakes and documents.",
    icon: Settings,
    path: "/dashboard",
    roles: ["admin", "super_admin"],
  },
  {
    title: "LMS MANAGEMENT",
    description: "Classes, learning content, assignments and quizzes.",
    icon: BookOpen,
    path: "/lms",
    roles: ["admin", "super_admin"],
  },
  {
    title: "ANALYTICS",
    description: "Reports, statistics and institutional insights.",
    icon: BarChart3,
    path: "/reports",
    roles: ["admin", "super_admin"],
  },
  {
    title: "INSTRUCTOR PORTAL",
    description: "Instructor tools, grading and class management.",
    icon: Presentation,
    path: "/instructor-portal",
    roles: ["instructor", "super_admin"],
  },
];

export default function ControlCenter({
  roles,
  attention,
}: {
  roles: PlatformRole[];
  attention: AttentionData;
}) {
  const roleSet = new Set(roles);
  const isSuperAdmin = roleSet.has("super_admin");
  const isAdmin = roleSet.has("admin") && !isSuperAdmin;
  const isInstructor = roleSet.has("instructor") && !isSuperAdmin && !roleSet.has("admin");

  const visiblePortals = portals.filter((portal) =>
    portal.roles.some((role) => roleSet.has(role))
  );

  const accountName = isSuperAdmin
    ? "Super Administrator"
    : isAdmin
      ? "Administrator"
      : isInstructor
        ? "Instructor"
        : "Internal User";

  const accountRole = isSuperAdmin
    ? "Super Admin"
    : isAdmin
      ? "Admin"
      : isInstructor
        ? "Lecturer"
        : "Internal";

  const initials = isSuperAdmin ? "SA" : isAdmin ? "AD" : isInstructor ? "IN" : "NU";

  const attentionItems = [
    {
      label: "Enrollments",
      sub: "Awaiting approval",
      count: attention.pendingEnrollments,
      path: "/enrollments",
      alert: attention.pendingEnrollments > 0,
    },
    {
      label: "Assignments",
      sub: "Awaiting grading",
      count: attention.ungradedSubmissions,
      path: "/lms/assignments",
      alert: attention.ungradedSubmissions > 0,
    },
    {
      label: "Unassigned Classes",
      sub: "Need an instructor",
      count: attention.unassignedClasses,
      path: "/lms/classes",
      alert: attention.unassignedClasses > 0,
    },
    {
      label: "Intake Alerts",
      sub: "Closing within 7 days",
      count: attention.closingIntakes,
      path: "/intakes",
      alert: attention.closingIntakes > 0,
    },
    {
      label: "Announcements",
      sub: "Scheduled ahead",
      count: attention.scheduledAnnouncements,
      path: "/lms/announcements",
      alert: false,
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="absolute left-0 top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/brand/nenasala-logo.png"
            alt="Nenasala"
            className="h-10 w-auto max-w-[165px] object-contain"
          />
          <div className="hidden border-l border-border pl-3 sm:block">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Internal Operating System</p>
          </div>
        </div>

        {!isInstructor && (
          <div className="mx-8 hidden max-w-md flex-1 md:block">
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                placeholder="Search records (Cmd + K)"
                className="w-full rounded-[var(--radius-sm)] border border-border bg-surface py-2 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-brand-primary/50"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isInstructor && (
            <button
              type="button"
              aria-label="Notifications"
              className="relative hidden rounded-[var(--radius-sm)] p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:block"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-brand-primary" />
            </button>
          )}
          <div className="hidden h-6 w-px bg-border md:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-foreground">{accountName}</p>
              <p className="text-[10px] text-brand-primary">{accountRole}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-[10px] border border-border bg-[var(--color-primary-soft)] text-xs font-bold text-brand-primary">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main className="z-10 mx-auto mt-16 flex w-full max-w-6xl flex-1 flex-col px-5 py-10 md:px-6 md:py-16">
        <header className="mb-10 md:mb-12">
          <h1 className="text-3xl font-light text-text-secondary md:text-4xl">Control Center</h1>
          <p className="mt-2 text-sm text-text-muted md:text-base">
            {isInstructor
              ? "Open your Instructor Portal to continue."
              : "Choose a workspace or review priority items."}
          </p>
        </header>

        {!isInstructor && (
          <section className="mb-10 md:mb-12">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Attention Center</h2>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10px] font-bold text-brand-primary">
                {attention.total} Priority Item{attention.total === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
              {attentionItems.map((item) => (
                <Link to={item.path} key={item.label} className="block h-full">
                  <Card
                    className={`flex h-full flex-col gap-1 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-brand-primary/50 ${
                      item.alert ? "border-l-4 border-l-brand-primary" : ""
                    }`}
                  >
                    <span className={`text-2xl font-bold ${item.alert ? "text-brand-primary" : "text-foreground"}`}>{item.count}</span>
                    <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                    <span className="text-[9px] text-text-muted">{item.sub}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-1 flex-col">
          <div className={`grid flex-1 grid-cols-1 gap-5 md:gap-6 ${visiblePortals.length === 1 ? "max-w-md" : "md:grid-cols-2 lg:grid-cols-4"}`}>
            {visiblePortals.map((portal) => (
              <Link to={portal.path} key={portal.title} className="block">
                <div className="group relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/50 hover:shadow-lg">
                  <portal.icon className="absolute -right-8 -top-8 h-48 w-48 rotate-12 text-foreground opacity-[0.025] transition-transform group-hover:scale-110 group-hover:rotate-6" />
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-elevated text-brand-primary">
                      <portal.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">{portal.title}</h3>
                    <p className="text-xs leading-relaxed text-text-muted">{portal.description}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-brand-primary">
                    ENTER PORTAL
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="z-10 mt-auto flex min-h-10 items-center justify-between border-t border-border bg-background px-5 py-2 text-[10px] text-text-muted md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            System UI Ready
          </span>
          <span>Development Build</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <span>Secure Internal Access</span>
        </div>
      </footer>
    </div>
  );
}
