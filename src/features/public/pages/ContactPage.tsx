"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import { submitContactMessageAction } from "@/lib/actions/public/contact";
import type { PlatformSettingsRecord } from "@/lib/services/platform-settings";

export function ContactPage({ settings }: { settings: PlatformSettingsRecord }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      const result = await submitContactMessageAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Unable to send your message.");
        return;
      }
      form.reset();
      setSent(true);
    });
  }

  const input =
    "mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]";

  return (
    <main className="flex-1 bg-[var(--color-background)] px-5 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            Talk to Nenasala Peradeniya.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Questions about courses, enrollment, certificates or your LMS account? Send us a message and it will go directly into our internal support inbox.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <aside className="space-y-4">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-sm">
              <div className="rounded-[calc(var(--radius-xl)-4px)] bg-[var(--color-surface-muted)] p-6">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{settings.institution_name}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  We’ll keep your inquiry inside the platform so our team can track its status and reply consistently.
                </p>

                <div className="mt-6 space-y-4">
                  {settings.support_email && (
                    <a href={`mailto:${settings.support_email}`} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <span>{settings.support_email}</span>
                    </a>
                  )}
                  {settings.support_phone && (
                    <a href={`tel:${settings.support_phone}`} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <span>{settings.support_phone}</span>
                    </a>
                  )}
                  {settings.address && (
                    <div className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <span className="whitespace-pre-wrap">{settings.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
              <div className="rounded-[calc(var(--radius-lg)-4px)] bg-[var(--color-surface-muted)] p-5">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">What happens next?</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Your message is saved in our internal inbox. If email delivery is enabled, you’ll also receive a branded acknowledgement and our team can reply through the same system.
                </p>
              </div>
            </div>
          </aside>

          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-sm">
            <div className="rounded-[calc(var(--radius-xl)-4px)] bg-[var(--color-surface-muted)] p-6 sm:p-8">
              {!settings.contact_form_enabled ? (
                <div className="grid min-h-[420px] place-items-center text-center">
                  <div>
                    <Mail className="mx-auto h-9 w-9 text-[var(--color-primary)]" />
                    <h2 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">Contact form temporarily unavailable</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      Please use the contact details shown on this page.
                    </p>
                  </div>
                </div>
              ) : sent ? (
                <div className="grid min-h-[420px] place-items-center text-center">
                  <div className="max-w-md">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h2 className="mt-5 text-2xl font-bold text-[var(--color-text-primary)]">Message received</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      Your inquiry is now in our support inbox. We’ll reply using the email address you provided.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="mt-6 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Send an inquiry</h2>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Name</span>
                      <input name="name" required maxLength={120} className={input} />
                    </label>

                    <label>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Email</span>
                      <input name="email" type="email" required className={input} />
                    </label>

                    <label>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Phone <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></span>
                      <input name="phone" maxLength={40} className={input} />
                    </label>

                    <label>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Category</span>
                      <select name="category" defaultValue="general" className={input}>
                        <option value="general">General</option>
                        <option value="course">Course information</option>
                        <option value="enrollment">Enrollment</option>
                        <option value="technical">Technical / LMS</option>
                        <option value="certificate">Certificates</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Subject</span>
                      <input name="subject" required maxLength={180} className={input} />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Message</span>
                      <textarea
                        name="message"
                        required
                        minLength={5}
                        maxLength={10000}
                        rows={7}
                        className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                      />
                    </label>

                    <div className="hidden" aria-hidden="true">
                      <label>
                        Website
                        <input name="website" tabIndex={-1} autoComplete="off" />
                      </label>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
                      {error}
                    </p>
                  )}

                  <button
                    disabled={pending}
                    type="submit"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {pending ? "Sending..." : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
