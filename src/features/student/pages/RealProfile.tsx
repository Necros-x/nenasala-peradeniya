"use client";

import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap, IdCard, Mail, Phone, Settings2, UserRound } from "lucide-react";
import type { StudentAccountProfile } from "@/lib/types/account";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function labelStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-1 break-words font-medium text-[var(--color-text-primary)]">{value}</p>
      </div>
    </div>
  );
}

export default function RealProfile({ profile }: { profile: StudentAccountProfile }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Student account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">My Profile</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">Your student identity, account details and current enrollment.</p>
        </div>
        <Link to="/settings">
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" /> Edit account settings
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <AccountAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} className="h-20 w-20" textClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-[var(--color-text-primary)]">{profile.fullName}</h2>
              <span className="rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)]">
                {labelStatus(profile.status)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5"><IdCard className="h-4 w-4 text-[var(--color-primary)]" /> {profile.studentNumber}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-[var(--color-primary)]" /> {profile.email}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-[var(--color-text-primary)]">Account details</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">Information connected to your student account.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow icon={UserRound} label="Full name" value={profile.fullName} />
              <DetailRow icon={IdCard} label="Student number" value={profile.studentNumber} />
              <DetailRow icon={Mail} label="Email" value={profile.email} />
              <DetailRow icon={Phone} label="Phone" value={profile.phone || "Not added"} />
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" /> Update personal details
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-[var(--color-text-primary)]">Current enrollment</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">Your latest active learning record.</p>
                </div>
              </div>

              {profile.currentEnrollment ? (
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Programme</dt>
                    <dd className="mt-1 font-medium text-[var(--color-text-primary)]">{profile.currentEnrollment.programmeName ?? "Programme"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Intake</dt>
                    <dd className="mt-1 text-[var(--color-text-primary)]">{profile.currentEnrollment.intakeName ?? "—"}</dd>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-t border-[var(--color-border)] pt-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Enrollment status</dt>
                      <dd className="mt-1 font-semibold text-[var(--color-primary)]">{labelStatus(profile.currentEnrollment.status)}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Enrolled</dt>
                      <dd className="mt-1 text-[var(--color-text-primary)]">{formatDate(profile.currentEnrollment.enrolledAt)}</dd>
                    </div>
                  </div>
                </dl>
              ) : (
                <p className="rounded-[var(--radius-md)] bg-[var(--color-background)] p-4 text-sm text-[var(--color-text-secondary)]">No enrollment is linked to this account yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 p-5">
              <CalendarDays className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Student since</p>
                <p className="mt-1 font-medium text-[var(--color-text-primary)]">{formatDate(profile.joinedAt ?? profile.createdAt)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
