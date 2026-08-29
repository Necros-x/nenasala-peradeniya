"use client";

import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Presentation,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { AdminInstructorRecord } from "@/lib/services/instructors";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { Badge } from "@/features/admin/components/ui/badge";

export default function InstructorPortalHub({
  instructors,
}: {
  instructors: AdminInstructorRecord[];
}) {
  const activeInstructors = instructors.filter((instructor) => instructor.status === "active").length;
  const assignedClasses = instructors.reduce(
    (total, instructor) => total + instructor.assigned_classes.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-primary">
            <Presentation className="h-4 w-4" />
            Instructor workspace control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Instructor Portal
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-text-secondary">
            Manage lecturer accounts and class access from the admin system. The live lecturer
            workspace remains protected and is opened by each instructor with their own account.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Lecturer workspace
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ExternalLink className="h-4 w-4 text-brand-primary" />
            /instructor/dashboard
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 pt-5">
            <UsersRound className="h-5 w-5 text-brand-primary" />
            <p className="mt-4 text-3xl font-bold text-text-primary">{instructors.length}</p>
            <p className="mt-1 text-sm text-text-secondary">Instructor accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 pt-5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="mt-4 text-3xl font-bold text-text-primary">{activeInstructors}</p>
            <p className="mt-1 text-sm text-text-secondary">Active instructors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 pt-5">
            <BookOpen className="h-5 w-5 text-brand-primary" />
            <p className="mt-4 text-3xl font-bold text-text-primary">{assignedClasses}</p>
            <p className="mt-1 text-sm text-text-secondary">Assigned classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link to="/instructors" className="group block">
          <Card className="h-full transition-colors group-hover:border-brand-primary/50">
            <CardContent className="flex h-full items-center gap-4 p-5 pt-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text-primary">Instructor accounts</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Invite lecturers, review account status and manage public profiles.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/lms/classes" className="group block">
          <Card className="h-full transition-colors group-hover:border-brand-primary/50">
            <CardContent className="flex h-full items-center gap-4 p-5 pt-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text-primary">Class assignments</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Assign each lecturer to the classes they are allowed to access.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-primary" />
            Portal access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-4 text-sm text-text-secondary">
            <p>
              Admin accounts stay inside the internal control system. Lecturer accounts sign in
              normally and are routed to <span className="font-semibold text-text-primary">/instructor/dashboard</span>.
              This prevents an admin session from accidentally becoming a lecturer session.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructor access status</CardTitle>
        </CardHeader>
        <CardContent>
          {instructors.length === 0 ? (
            <div className="py-10 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-3 font-semibold text-text-primary">No instructors yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Invite the first lecturer from Instructor Accounts.
              </p>
              <Link
                to="/instructors"
                className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-brand-primary px-4 py-2.5 text-sm font-semibold text-[var(--color-static-white)] transition-opacity hover:opacity-90"
              >
                Invite instructor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{instructor.full_name}</p>
                      <Badge variant={instructor.status === "active" ? "success" : "secondary"}>
                        {instructor.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {instructor.professional_title ?? "Instructor"}
                      {instructor.email ? ` · ${instructor.email}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">
                        {instructor.assigned_classes.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">
                        Classes
                      </p>
                    </div>
                    <Badge variant={instructor.assigned_classes.length > 0 ? "success" : "warning"}>
                      {instructor.assigned_classes.length > 0 ? "Portal ready" : "Needs class"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
