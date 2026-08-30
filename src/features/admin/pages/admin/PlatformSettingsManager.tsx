"use client";

import { useTransition } from "react";
import { CheckCircle2, Mail, Save, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { savePlatformSettingsAction } from "@/lib/actions/admin/platform-settings";
import type { PlatformSettingsRecord } from "@/lib/services/platform-settings";

export default function PlatformSettingsManager({
  settings,
  resend,
  accessKey,
  canEdit,
}: {
  settings: PlatformSettingsRecord;
  resend: { configured: boolean; from: string | null; replyTo: string | null };
  accessKey: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);

    startTransition(async () => {
      const result = await savePlatformSettingsAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save settings.");
        return;
      }
      toast.success("Platform settings saved.");
      router.refresh();
    });
  }

  const input =
    "mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">System</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Platform Settings</h1>
        <p className="mt-1 text-text-secondary">
          Institution identity, website contact behavior and email-delivery status.
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-1">
          <div className="rounded-[calc(var(--radius-md)-4px)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            Settings are read-only for Admin accounts. Only Super Admin can change platform-wide configuration.
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 sm:p-6">
            <h2 className="text-lg font-bold text-text-primary">Institution & contact</h2>
            <p className="mt-1 text-xs text-text-muted">Used by the public Contact page and automated customer emails.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-text-primary">Institution name</span>
                <input
                  name="institution_name"
                  required
                  maxLength={120}
                  disabled={!canEdit}
                  defaultValue={settings.institution_name}
                  className={input}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-text-primary">Support email</span>
                <input
                  name="support_email"
                  type="email"
                  disabled={!canEdit}
                  defaultValue={settings.support_email ?? ""}
                  placeholder="support@example.com"
                  className={input}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-text-primary">Support phone</span>
                <input
                  name="support_phone"
                  disabled={!canEdit}
                  defaultValue={settings.support_phone ?? ""}
                  placeholder="+94 ..."
                  className={input}
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-text-primary">Contact notification email</span>
                <input
                  name="contact_notification_email"
                  type="email"
                  disabled={!canEdit}
                  defaultValue={settings.contact_notification_email ?? ""}
                  placeholder="Where new website inquiries should be emailed"
                  className={input}
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-text-primary">Address</span>
                <textarea
                  name="address"
                  rows={3}
                  disabled={!canEdit}
                  defaultValue={settings.address ?? ""}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-start gap-3 rounded-md border border-border bg-background p-4">
                <input
                  name="contact_form_enabled"
                  type="checkbox"
                  defaultChecked={settings.contact_form_enabled}
                  disabled={!canEdit}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>
                  <span className="block text-sm font-bold text-text-primary">Public contact form enabled</span>
                  <span className="mt-0.5 block text-xs leading-5 text-text-muted">
                    Disable this temporarily if you do not want the website accepting new inquiries.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-md border border-border bg-background p-4">
                <input
                  name="contact_auto_reply_enabled"
                  type="checkbox"
                  defaultChecked={settings.contact_auto_reply_enabled}
                  disabled={!canEdit}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>
                  <span className="block text-sm font-bold text-text-primary">Automatic contact acknowledgement</span>
                  <span className="mt-0.5 block text-xs leading-5 text-text-muted">
                    Send a branded Resend confirmation after a visitor submits an inquiry.
                  </span>
                </span>
              </label>
            </div>

            {canEdit && (
              <button
                type="submit"
                disabled={pending}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] hover:bg-brand-primary-hover disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {pending ? "Saving..." : "Save settings"}
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
            <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Email delivery</p>
                  <h2 className="mt-1 text-lg font-bold text-text-primary">Resend</h2>
                </div>
                {resend.configured ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-success-soft)] px-3 py-1 text-xs font-bold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-error-soft)] px-3 py-1 text-xs font-bold text-danger">
                    <XCircle className="h-3.5 w-3.5" /> Missing env
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs text-text-muted">Sender</p>
                  <p className="mt-1 break-all font-semibold text-text-primary">{resend.from ?? "RESEND_FROM_EMAIL not configured"}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs text-text-muted">Default reply-to</p>
                  <p className="mt-1 break-all font-semibold text-text-primary">{resend.replyTo ?? "Not configured"}</p>
                </div>
              </div>

              <p className="mt-4 flex gap-2 text-xs leading-5 text-text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                API keys are never stored in Supabase or exposed here. They remain in your server/Vercel environment.
              </p>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
            <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
              <Mail className="h-5 w-5 text-brand-primary" />
              <h2 className="mt-4 font-bold text-text-primary">Email preference scope</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Student notification preferences remain per-account. These settings control only platform contact behavior and institution contact details.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
