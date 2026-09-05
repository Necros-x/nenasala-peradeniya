"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/features/admin/components/ui/button";
import { Input } from "@/features/admin/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { requestPasswordResetAction } from "@/lib/actions/auth/password-reset";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function AdminLoginForm() {
  const params = useParams<{ accessKey: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Unable to verify this account.");

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);
      if (roleError) throw roleError;

      const roles = new Set((roleRows ?? []).map((row) => row.role));
      const allowed = roles.has("staff") || roles.has("instructor") || roles.has("admin") || roles.has("super_admin");

      if (!allowed) {
        await supabase.auth.signOut();
        throw new Error("This account does not have internal portal access.");
      }

      router.replace(`/internal/${params.accessKey}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    setResetting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestPasswordResetAction(email, `/internal/${params.accessKey}`);
      if (result.delivery === "unavailable") {
        setError("Resend is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL first.");
        return;
      }
      setMessage("If this account exists, a secure password-reset email has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a password reset.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-15%,var(--color-primary-soft),transparent_38%)] opacity-70" />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandLogo className="h-14 w-auto max-w-[240px]" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Nenasala Internal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1 max-w-sm text-sm leading-6 text-text-secondary">
            Sign in to continue to the workspace available for your account.
          </p>
        </div>

        <Card className="border-border shadow-[var(--shadow-floating)]">
          <CardHeader>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the email and password linked to your Nenasala internal account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="text-sm font-medium text-text-primary">Email</label>
                <Input id="admin-email" type="email" autoComplete="username" required className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="admin-password" className="text-sm font-medium text-text-primary">Password</label>
                <Input id="admin-password" type="password" autoComplete="current-password" required className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  disabled={resetting}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover disabled:opacity-50"
                >
                  {resetting ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--status-error-soft)] px-3 py-2.5 text-sm text-danger">{error}</p>}
              {!error && message && <p className="rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] px-3 py-2.5 text-sm text-brand-primary">{message}</p>}

              <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-start gap-2 px-2 text-xs leading-5 text-text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
          Access is based on your assigned role. You will be taken to the Control Center after sign-in.
        </div>
      </div>

      <ThemeMenu
        placement="top"
        className="fixed bottom-5 right-5 z-[140]"
      />
    </main>
  );
}
