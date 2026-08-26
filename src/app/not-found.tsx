import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-[var(--color-background)] px-6">
      <div className="max-w-lg text-center">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="mx-auto h-16 w-auto max-w-[260px] object-contain" />
        <p className="mt-10 text-sm font-bold tracking-[0.18em] text-[var(--color-primary)]">404</p>
        <h1 className="mt-3 text-4xl font-bold text-[var(--color-text-primary)]">Page not found</h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">The page you requested does not exist or is not available.</p>
        <Link href="/" className="mt-8 inline-flex rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-static-white)] hover:bg-[var(--color-primary-hover)]">Return home</Link>
      </div>
    </main>
  );
}
