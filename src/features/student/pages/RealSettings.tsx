"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, CheckCircle2, Mail, Monitor, Moon, Save, ShieldCheck, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme/ThemeProvider";
import { saveStudentSettingsAction } from "@/lib/actions/preferences";
import type { CurrentStudentSettings, ThemePreference, UserPreferences } from "@/lib/services/preferences";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import { Input } from "@/features/student/components/ui/Input";
import { Switch } from "@/features/student/components/ui/Switch";

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
  const [tab, setTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState(initialSettings.fullName);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [preferences, setPreferences] = useState<UserPreferences>(initialSettings.preferences);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPreferences((current) => ({ ...current, themePreference: theme }));
  }, [theme]);

  function togglePreference(key: (typeof emailOptions)[number]["key"], checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }));
  }

  function submit() {
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("phone", phone);
    formData.set("theme_preference", theme);
    for (const option of emailOptions) {
      if (preferences[option.key]) formData.set(option.field, "on");
    }

    startTransition(async () => {
      const result = await saveStudentSettingsAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save settings.");
        return;
      }
      toast.success("Settings saved.");
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Account Settings</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Manage your profile, email preferences and appearance.</p>
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
        <Card className="max-w-2xl">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] text-xl font-bold text-[var(--color-primary)]">
                {initialSettings.avatarUrl ? <img src={initialSettings.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initialSettings.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-[var(--color-text-primary)]">Student profile</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Basic details used across your learning account.</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Full name</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input value={initialSettings.email} readOnly className="pl-9 opacity-80" />
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">Your sign-in email is managed by your account credentials.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Phone</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" />
              </div>
            </div>
          </div>
        </Card>
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
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your signed-in preference is saved to your account and this device.</p>
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

      <div className="flex max-w-2xl items-center gap-3 border-t border-[var(--color-border)] pt-5">
        <Button onClick={submit} disabled={pending} className="min-w-36">
          <Save className="mr-2 h-4 w-4" /> {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
