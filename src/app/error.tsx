"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center bg-[var(--color-background)] px-6">
      <div className="max-w-lg text-center">
        <p className="text-sm font-bold tracking-[0.18em] text-[var(--color-error)]">ERROR</p>
        <h1 className="mt-3 text-4xl font-bold text-[var(--color-text-primary)]">Something went wrong</h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">The application could not complete this request.</p>
        <button onClick={reset} className="mt-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-static-white)] hover:bg-[var(--color-primary-hover)]">Try again</button>
      </div>
    </main>
  );
}
