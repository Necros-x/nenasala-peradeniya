"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/features/public/components/ui/Button";
import { Input } from "@/features/public/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/public/components/ui/Card";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { data: roleRows } = await supabase.from("user_roles").select("role");
      const roles = new Set((roleRows ?? []).map((row) => row.role));
      const destination = roles.has("instructor") ? "/instructor/dashboard" : "/student/dashboard";

      setSuccess(true);
      window.setTimeout(() => {
        router.replace(destination);
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 grid place-items-center bg-[var(--color-surface-muted)] px-4 pt-32 pb-16">
      <div className="w-full max-w-md">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="mx-auto mb-8 h-16 w-auto max-w-[260px] object-contain" />
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>Choose a strong password for your Nenasala account.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <p className="rounded-[var(--radius-sm)] bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">Password updated. Redirecting to your portal…</p>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="text-sm font-medium text-[var(--color-text-primary)]">New password</label>
                  <Input id="new-password" type="password" autoComplete="new-password" required className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium text-[var(--color-text-primary)]">Confirm password</label>
                  <Input id="confirm-password" type="password" autoComplete="new-password" required className="mt-1.5" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] px-3 py-2.5 text-sm text-[var(--color-error)]">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
