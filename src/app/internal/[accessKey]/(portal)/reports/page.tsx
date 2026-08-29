import { BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Institution Analytics</h1>
        <p className="mt-1 text-text-secondary">
          Reporting and analytics workspace. Real metrics will be connected in the analytics phase.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-brand-primary" />
          <p className="mt-4 font-semibold text-text-primary">Analytics workspace ready</p>
          <p className="mt-1 text-sm text-text-secondary">
            This route is protected for Admin and Super Admin accounts.
          </p>
        </div>
      </div>
    </div>
  );
}
