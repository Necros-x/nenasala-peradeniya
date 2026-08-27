import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemoModeEnabled } from "@/lib/demo/session";

export const metadata: Metadata = {
  title: "Demo Access",
  robots: { index: false, follow: false },
};

export default async function DemoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isDemoModeEnabled()) notFound();

  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center bg-[var(--color-surface-muted)] px-4 py-12">
      <div className="w-full max-w-md">
        <img
          src="/brand/nenasala-logo.png"
          alt="Nenasala"
          className="mx-auto mb-8 h-16 w-auto max-w-[260px] object-contain"
        />

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Client Preview
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">Demo access</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Enter the temporary preview code to review the LMS interface.
          </p>

          <form action="/api/demo/access" method="post" className="mt-6 space-y-4">
            <div>
              <label htmlFor="demo-code" className="text-sm font-medium text-[var(--color-text-primary)]">
                Demo access code
              </label>
              <input
                id="demo-code"
                name="code"
                type="password"
                required
                autoComplete="off"
                className="mt-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            {error === "invalid" && (
              <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
                Invalid demo access code.
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-3 font-semibold text-[var(--color-static-white)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Enter Preview
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
