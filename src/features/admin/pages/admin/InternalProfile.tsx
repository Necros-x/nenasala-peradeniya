"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { saveOwnProfileAction } from "@/lib/actions/account-profile";
import type { AccountProfile, AccountRole } from "@/lib/types/account";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { Input } from "@/features/admin/components/ui/input";
import { Badge } from "@/features/admin/components/ui/badge";

function roleLabel(role: AccountRole) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  if (role === "instructor") return "Instructor";
  return "Student";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function InternalProfile({ profile }: { profile: AccountProfile }) {
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Internal account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-text-secondary">Your identity and contact details across the Nenasala management workspace.</p>
      </div>

      <Card className="rounded-[var(--radius-lg)] border-border">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <AccountAvatar name={fullName} avatarUrl={profile.avatarUrl} className="h-20 w-20" textClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-foreground">{fullName}</h2>
            <p className="mt-1 truncate text-sm text-text-secondary">{profile.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.roles.map((role) => <Badge key={role} variant={role === "super_admin" ? "default" : "secondary"}>{roleLabel(role)}</Badge>)}
              <Badge variant={profile.status === "active" ? "success" : profile.status === "suspended" ? "danger" : "warning"}>{profile.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card className="rounded-[var(--radius-lg)] border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-brand-primary"><UserRound className="h-5 w-5" /></span>
              <div><CardTitle>Personal details</CardTitle><p className="mt-1 text-sm text-text-secondary">Used in internal screens and audit context.</p></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label htmlFor="internal-name" className="text-sm font-medium text-foreground">Full name</label>
              <Input id="internal-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <label htmlFor="internal-email" className="text-sm font-medium text-foreground">Email address</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input id="internal-email" value={profile.email} readOnly className="pl-9 opacity-80" />
              </div>
              <p className="mt-1.5 text-xs text-text-muted">Your sign-in email is managed by account credentials.</p>
            </div>
            <div>
              <label htmlFor="internal-phone" className="text-sm font-medium text-foreground">Phone</label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input id="internal-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" className="pl-9" />
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <Button onClick={saveProfile} disabled={pending} className="gap-2"><Save className="h-4 w-4" /> {pending ? "Saving…" : "Save profile"}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[var(--radius-lg)] border-border">
            <CardContent className="p-5">
              <ShieldCheck className="h-5 w-5 text-success" />
              <p className="mt-3 font-semibold text-foreground">Account access</p>
              <p className="mt-1 text-sm leading-5 text-text-secondary">Permissions are controlled by your assigned role. Role changes are managed separately.</p>
            </CardContent>
          </Card>
          <Card className="rounded-[var(--radius-lg)] border-border">
            <CardContent className="flex items-start gap-3 p-5">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
              <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Account created</p><p className="mt-1 font-medium text-foreground">{formatDate(profile.createdAt)}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
