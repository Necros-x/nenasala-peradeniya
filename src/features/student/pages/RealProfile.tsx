"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap, IdCard, Mail, Phone, Save, Settings2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { saveOwnProfileAction } from "@/lib/actions/account-profile";
import type { StudentAccountProfile } from "@/lib/types/account";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import { Input } from "@/features/student/components/ui/Input";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function labelStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RealProfile({ profile }: { profile: StudentAccountProfile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [pending, startTransition] = useTransition();

  function saveProfile() {
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await saveOwnProfileAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save your profile.");
        return;
      }

      setFullName(result.fullName ?? fullName);
      setPhone(result.phone ?? phone);
      window.dispatchEvent(new Event("nenasala:profile-updated"));
      router.refresh();
      toast.success("Profile updated.");
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Student account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">My Profile</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">Your personal details and current enrollment information.</p>
        </div>
        <Link to="/settings">
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" /> Settings
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <AccountAvatar name={fullName} avatarUrl={profile.avatarUrl} className="h-20 w-20" textClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-[var(--color-text-primary)]">{fullName}</h2>
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
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-[var(--color-text-primary)]">Personal details</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Keep your contact details up to date.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Full name</label>
                <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input id="profile-email" value={profile.email} readOnly className="pl-9 opacity-80" />
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">Your sign-in email cannot be changed here.</p>
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input id="profile-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" className="pl-9" />
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5">
                <Button onClick={saveProfile} disabled={pending} className="gap-2">
                  <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save profile"}
                </Button>
              </div>
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
