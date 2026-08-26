"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/features/admin/components/ui/button";
import { Input } from "@/features/admin/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const params = useParams<{ accessKey: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace(`/internal/${params.accessKey}/dashboard`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 grid place-items-center">
      <div className="w-full max-w-md">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="mx-auto mb-8 h-16 w-auto max-w-[260px] object-contain" />
        <Card className="border-border shadow-[var(--shadow-floating)]">
          <CardHeader>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle>Administrative access</CardTitle>
            <CardDescription>Sign in with an authorized Nenasala administrator account.</CardDescription>
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
              {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--status-error-soft)] px-3 py-2.5 text-sm text-danger">{error}</p>}
              <Button disabled={loading} type="submit" className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
