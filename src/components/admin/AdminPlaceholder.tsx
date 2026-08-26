import { Construction } from "lucide-react";

export function AdminPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="min-h-[60vh] grid place-items-center">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Construction className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        <p className="mt-3 text-text-secondary">{description}</p>
      </div>
    </section>
  );
}
