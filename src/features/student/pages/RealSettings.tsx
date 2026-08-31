"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Bell, CheckCircle2, Monitor, Moon, Save, ShieldCheck, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme/ThemeProvider";
import { saveStudentPreferencesAction } from "@/lib/actions/preferences";
import type { CurrentStudentSettings, ThemePreference, UserPreferences } from "@/lib/services/preferences";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
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
    formData.set("theme_preference", theme);
    for (const option of emailOptions) {
      if (preferences[option.key]) formData.set(option.field, "on");
    }

    startTransition(async () => {
      const result = await saveStudentPreferencesAction(formData);
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
        <p className="mt-1 text-[var(--color-text-secondary)]">Manage your account details, email preferences and appearance.</p>
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
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] text-xl font-bold text-[var(--color-primary)]">
                {initialSettings.avatarUrl ? <img src={initialSettings.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initialSettings.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-[var(--color-text-primary)]">{initialSettings.fullName}</h2>
                <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">{initialSettings.email}</p>
                <p className="mt-2 text-sm leading-5 text-[var(--color-text-muted)]">Personal details and enrollment information now live on your dedicated profile page.</p>
              </div>
              <Link to="/profile" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-2">
                  Manage profile <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
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
