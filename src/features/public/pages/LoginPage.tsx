"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/student/dashboard`,
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage("Account created. Check your email to confirm your account before signing in.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      // The /student layout performs the real server-side role check.
      router.replace("/student/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setMessage("Password reset instructions have been sent if an account exists for this email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the reset email.");
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 pt-32 pb-12 sm:px-6 lg:px-8 bg-[var(--color-surface-muted)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-16 w-auto max-w-[260px] object-contain mx-auto" />
        <h1 className="mt-8 text-3xl font-extrabold text-[var(--color-text-primary)]">
          {isSignUp ? "Create your student account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {isSignUp ? "Create your credentials to access your learning portal." : "Sign in to continue learning."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-[var(--shadow-card)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle>{isSignUp ? "Student Sign Up" : "Student Login"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Enter your information to create an account." : "Enter your student credentials."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">Full Name</label>
                  <Input id="name" className="mt-1" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)]">Email address</label>
                <Input id="email" className="mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)]">Password</label>
                <Input id="password" className="mt-1" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" />
                    Remember me
                  </label>
                  <button type="button" onClick={sendPasswordReset} className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Forgot password?</button>
                </div>
              )}

              {error && <p role="alert" className="rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] px-3 py-2.5 text-sm text-[var(--color-error)]">{error}</p>}
              {message && <p className="rounded-[var(--radius-sm)] bg-[var(--color-info-soft)] px-3 py-2.5 text-sm text-[var(--color-info)]">{message}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              {isSignUp ? "Already have an account?" : "New student?"}{" "}
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                {isSignUp ? "Sign in" : "Create account"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
