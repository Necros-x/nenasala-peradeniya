"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, Camera, CheckCircle2, Mail, Monitor, Moon, Phone, Save, ShieldCheck, Sun, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme/ThemeProvider";
import { AccountAvatar } from "@/components/account/AccountAvatar";
import { removeOwnAvatarAction, saveOwnProfileAction } from "@/lib/actions/account-profile";
import { saveStudentPreferencesAction } from "@/lib/actions/preferences";
import type { CurrentStudentSettings, ThemePreference, UserPreferences } from "@/lib/services/preferences";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import { Input } from "@/features/student/components/ui/Input";
import { Switch } from "@/features/student/components/ui/Switch";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const emailOptions: Array<{
  key: keyof Pick<UserPreferences, "emailAnnouncements" | "emailAssignments" | "emailQuizzes" | "emailLiveSessions" | "emailCourseUpdates" | "emailCertificates">;
  field: string;
  label: string;
  description: string;
}> = [
  { key: "emailAnnouncements", field: "email_announcements", label: "Announcements", description: "Important institute, course and class announcements." },
  { key: "emailAssignments", field: "email_assignments", label: "Assignments & grading", description: "New assignments, feedback and resubmission permissions." },
  { key: "emailQuizzes", field: "email_quizzes", label: "Quizzes & results", description: "Published quizzes, results and additional attempt permissions." },
  { key: "emailLiveSessions", field: "email_live_sessions", label: "Live classes", description: "Live-class scheduling and session updates when available." },
  { key: "emailCourseUpdates", field: "email_course_updates", label: "Course updates", description: "Learning-content and course-related updates." },
  { key: "emailCertificates", field: "email_certificates", label: "Certificates", description: "Certificate issue, reissue and credential-status updates." },
];

const themeOptions: Array<{ value: ThemePreference; label: string; description: string; icon: typeof Monitor }> = [
  { value: "system", label: "System", description: "Follow this device's appearance.", icon: Monitor },
  { value: "light", label: "Light", description: "Always use the light theme.", icon: Sun },
  { value: "dark", label: "Dark", description: "Always use the dark theme.", icon: Moon },
];

type Tab = "profile" | "notifications" | "appearance";

export default function RealSettings({ initialSettings }: { initialSettings: CurrentStudentSettings }) {
  const { theme, setTheme } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState(initialSettings.fullName);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [avatarUrl, setAvatarUrl] = useState(initialSettings.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(initialSettings.preferences);
  const [profilePending, startProfileTransition] = useTransition();
  const [preferencesPending, startPreferencesTransition] = useTransition();

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  function togglePreference(key: (typeof emailOptions)[number]["key"], checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }));
  }

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

    startProfileTransition(async () => {
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
      toast.success("Profile settings saved.");
    });
  }

  function removeAvatar() {
    startProfileTransition(async () => {
      const result = await removeOwnAvatarAction();
      if (!result.ok) {
        toast.error(result.error ?? "Unable to remove your profile photo.");
        return;
      }

      setAvatarUrl(null);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      window.dispatchEvent(new Event("nenasala:profile-updated"));
      toast.success("Profile photo removed.");
    });
  }

  function saveNotifications() {
    const formData = new FormData();
    formData.set("theme_preference", theme);
    for (const option of emailOptions) {
      if (preferences[option.key]) formData.set(option.field, "on");
    }

    startPreferencesTransition(async () => {
      const result = await saveStudentPreferencesAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save notification settings.");
        return;
      }
      toast.success("Notification settings saved.");
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Account Settings</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Manage personal details, email preferences and appearance.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {([
          ["profile", "Profile", User],
          ["notifications", "Notifications", Bell],
          ["appearance", "Appearance", Monitor],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === value ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <AccountAvatar name={fullName} avatarUrl={avatarPreview ?? avatarUrl} className="h-20 w-20" textClassName="text-xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold text-[var(--color-text-primary)]">{fullName}</h2>
                  <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">{initialSettings.email}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">JPG, PNG or WebP. Maximum 4 MB.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={profilePending}
                  >
                    <Camera className="h-3.5 w-3.5" /> {avatarUrl || avatarFile ? "Change photo" : "Add photo"}
                  </Button>
                  {(avatarUrl || avatarFile) && (
                    <Button type="button" variant="danger" size="sm" className="gap-2" onClick={removeAvatar} disabled={profilePending}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <div>
                  <label htmlFor="settings-name" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Full name</label>
                  <Input id="settings-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="settings-email" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <Input id="settings-email" value={initialSettings.email} readOnly className="pl-9 opacity-80" />
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">Your sign-in email cannot be changed from profile settings.</p>
                </div>
                <div>
                  <label htmlFor="settings-phone" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <Input id="settings-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-5">
                <Button onClick={saveProfile} disabled={profilePending} className="min-w-36">
                  <Save className="mr-2 h-4 w-4" /> {profilePending ? "Saving..." : "Save profile"}
                </Button>
                <Link to="/profile">
                  <Button variant="outline" type="button">View student profile</Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Sign-in security</h3>
                <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">Your role and sign-in email are not editable here. Password recovery continues through the secure sign-in flow.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "notifications" && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <div className="p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Email notifications</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Choose which learning updates are also sent to your inbox.</p>
              </div>
              <div className="space-y-3">
                {emailOptions.map((option) => (
                  <div key={option.key} className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{option.label}</h3>
                      <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">{option.description}</p>
                    </div>
                    <Switch checked={preferences[option.key]} onCheckedChange={(value) => togglePreference(option.key, value)} />
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                <Button onClick={saveNotifications} disabled={preferencesPending} className="min-w-36">
                  <Save className="mr-2 h-4 w-4" /> {preferencesPending ? "Saving..." : "Save notifications"}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Security & transactional email stays on</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Password resets, account-security messages, receipts and other essential transactional emails cannot be disabled.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "appearance" && (
        <Card className="max-w-2xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Appearance</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your signed-in preference is saved automatically to your account and this device.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const selected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`rounded-[var(--radius-md)] border p-4 text-left transition-colors ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary-muted)]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`h-5 w-5 ${selected ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`} />
                      {selected && <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />}
                    </div>
                    <p className="mt-4 font-semibold text-[var(--color-text-primary)]">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
