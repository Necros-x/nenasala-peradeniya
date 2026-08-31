"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Camera, Mail, Phone, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { removeOwnAvatarAction, saveOwnProfileAction } from "@/lib/actions/account-profile";
import type { AccountProfile, AccountRole } from "@/lib/types/account";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { Input } from "@/features/admin/components/ui/input";
import { Badge } from "@/features/admin/components/ui/badge";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  function chooseAvatar(file: File | null) {
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error("Use a JPG, PNG or WebP profile photo.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Profile photo must be 4 MB or smaller.");
      return;
    }
    setAvatarFile(file);
  }

  function saveProfile() {
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("phone", phone);
    if (avatarFile) formData.set("avatar", avatarFile);

    startTransition(async () => {
      const result = await saveOwnProfileAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save your profile.");
        return;
      }
      setFullName(result.fullName);
      setPhone(result.phone);
      setAvatarUrl(result.avatarUrl);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      window.dispatchEvent(new Event("nenasala:profile-updated"));
      router.refresh();
      toast.success("Profile updated.");
    });
  }

  function removeAvatar() {
    startTransition(async () => {
      const result = await removeOwnAvatarAction();
      if (!result.ok) {
        toast.error(result.error ?? "Unable to remove your profile photo.");
        return;
      }
      setAvatarUrl(null);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      window.dispatchEvent(new Event("nenasala:profile-updated"));
      router.refresh();
      toast.success("Profile photo removed.");
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
          <AccountAvatar name={fullName} avatarUrl={avatarPreview ?? avatarUrl} className="h-20 w-20" textClassName="text-xl" />
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
            <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <AccountAvatar name={fullName} avatarUrl={avatarPreview ?? avatarUrl} className="h-16 w-16" textClassName="text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Profile photo</p>
                  <p className="mt-1 text-xs text-text-muted">JPG, PNG or WebP. Maximum 4 MB.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => avatarInputRef.current?.click()} disabled={pending}>
                    <Camera className="h-3.5 w-3.5" /> {avatarUrl || avatarFile ? "Change" : "Add photo"}
                  </Button>
                  {(avatarUrl || avatarFile) && (
                    <Button type="button" variant="danger" size="sm" className="gap-2" onClick={removeAvatar} disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

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
              <p className="mt-1 text-sm leading-5 text-text-secondary">Permissions are controlled by your assigned role. Role changes are managed separately and cannot be changed from this page.</p>
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
