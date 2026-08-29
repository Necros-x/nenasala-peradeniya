"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordResetAction } from "@/lib/actions/auth/password-reset";

const CAMERA_TRANSITION = {
  type: "spring" as const,
  stiffness: 105,
  damping: 22,
  mass: 0.95,
};

type FieldProps = {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  rightSlot?: React.ReactNode;
};

function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  placeholder,
  icon,
  required = true,
  rightSlot,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[var(--color-text-secondary)]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-[18px] border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-11 shadow-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0"
        />
        {rightSlot && <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

function AuthVisual({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="relative flex h-full min-h-[620px] items-center justify-center overflow-hidden bg-[var(--color-primary-soft)] px-10 py-12">
      <motion.div
        animate={{ x: mode === "signup" ? -18 : 18, y: mode === "signup" ? 18 : -10 }}
        transition={CAMERA_TRANSITION}
        className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-[var(--color-primary-muted)]/80 blur-[2px]"
      />
      <motion.div
        animate={{ x: mode === "signup" ? 25 : -18, y: mode === "signup" ? -12 : 22 }}
        transition={CAMERA_TRANSITION}
        className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[var(--color-static-white)]/70"
      />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          animate={{ rotate: mode === "signup" ? -2 : 2, y: mode === "signup" ? -8 : 8 }}
          transition={CAMERA_TRANSITION}
          className="relative mx-auto aspect-[4/3] max-w-[420px] rounded-[36px] border border-[var(--color-static-white)]/70 bg-[var(--color-static-white)]/78 p-5 shadow-[var(--shadow-floating)] backdrop-blur-xl"
        >
          <div className="relative flex h-full flex-col overflow-hidden rounded-[26px] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between">
              <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-9 w-auto max-w-[145px] object-contain" />
              <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                Student LMS
              </span>
            </div>

            <div className="my-auto flex items-center justify-center">
              <div className="relative grid h-56 w-64 place-items-center">
                <div className="absolute h-52 w-52 rounded-full bg-[var(--color-primary-soft)]" />
                <div className="relative z-10 grid h-36 w-36 place-items-center rounded-[42px] bg-[var(--color-primary)] text-[var(--color-static-white)] shadow-lg">
                  <GraduationCap className="h-16 w-16" strokeWidth={1.6} />
                </div>
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute right-0 top-4 z-20 grid h-14 w-14 place-items-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md"
                >
                  <BookOpen className="h-6 w-6" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-5 left-2 z-20 grid h-12 w-12 place-items-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md"
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                {mode === "signup" ? "Start learning" : "Continue learning"}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {mode === "signup" ? "Your learning journey starts here." : "Everything you need, in one learning space."}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Access classes, recordings, assignments, quizzes and progress from your Nenasala student portal.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function switchMode(signUp: boolean) {
    setIsSignUp(signUp);
    setError(null);
    setMessage(null);
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

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
      await requestPasswordResetAction(email);
      setMessage("Password reset instructions have been sent if an account exists for this email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the reset email.");
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((value) => !value)}
      className="grid h-8 w-8 place-items-center rounded-[12px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const feedback = (
    <AnimatePresence mode="wait">
      {error && (
        <motion.p
          key="error"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          role="alert"
          className="rounded-[16px] bg-[var(--color-error-soft)] px-3.5 py-3 text-sm text-[var(--color-error)]"
        >
          {error}
        </motion.p>
      )}
      {!error && message && (
        <motion.p
          key="message"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-[16px] bg-[var(--color-info-soft)] px-3.5 py-3 text-sm text-[var(--color-info)]"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const loginForm = (
    <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
      <div className="mb-8">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="mb-8 h-11 w-auto max-w-[180px] object-contain" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Student Portal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          Sign in to continue your classes and learning progress.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
        />

        <AuthField
          id="login-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          icon={<LockKeyhole className="h-4 w-4" />}
          rightSlot={passwordToggle}
        />

        <div className="flex items-center justify-between gap-4 pt-1 text-xs">
          <label className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" />
            Remember me
          </label>
          <button
            type="button"
            onClick={sendPasswordReset}
            className="font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Forgot password?
          </button>
        </div>

        {feedback}

        <Button type="submit" className="mt-2 h-12 w-full rounded-[18px]" size="lg" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode(true)}
          className="font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          Sign up
        </button>
      </p>
    </div>
  );

  const signupForm = (
    <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
      <div className="mb-7">
        <img src="/brand/nenasala-logo.png" alt="Nenasala" className="mb-7 h-11 w-auto max-w-[180px] object-contain" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Create Student Account</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">Start learning.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          Create your account to access the Nenasala learning portal.
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <AuthField
          id="signup-name"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={setName}
          placeholder="Your full name"
          icon={<UserRound className="h-4 w-4" />}
        />

        <AuthField
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
        />

        <AuthField
          id="signup-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          icon={<LockKeyhole className="h-4 w-4" />}
          rightSlot={passwordToggle}
        />

        <AuthField
          id="signup-confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your password"
          icon={<LockKeyhole className="h-4 w-4" />}
        />

        {feedback}

        <Button type="submit" className="mt-2 h-12 w-full rounded-[18px]" size="lg" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode(false)}
          className="font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          Sign in
        </button>
      </p>
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden bg-[var(--color-surface-muted)] px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
      <div className="mx-auto w-full max-w-7xl">
        {/* Desktop: three-panel stage. The viewport shows two panels at once.
            Login -> [Login | Visual]
            Sign up -> [Visual | Sign up]
            Moving the 150%-wide track by one panel creates the camera-pan effect. */}
        <div className="hidden min-h-[660px] overflow-hidden rounded-[40px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-floating)] lg:block">
          <motion.div
            className="flex min-h-[660px] w-[150%]"
            animate={{ x: isSignUp ? "-33.333333%" : "0%" }}
            transition={CAMERA_TRANSITION}
          >
            <section className="w-1/3 shrink-0 bg-[var(--color-surface)]">{loginForm}</section>
            <section className="w-1/3 shrink-0">
              <AuthVisual mode={isSignUp ? "signup" : "login"} />
            </section>
            <section className="w-1/3 shrink-0 bg-[var(--color-surface)]">{signupForm}</section>
          </motion.div>
        </div>

        {/* Mobile/tablet keeps the visual compact and slides the active form. */}
        <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] lg:hidden">
          <div className="relative h-52 overflow-hidden bg-[var(--color-primary-soft)] sm:h-60">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[var(--color-primary-muted)]" />
            <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[var(--color-static-white)]/70" />
            <div className="relative z-10 flex h-full items-center justify-between gap-5 px-7 sm:px-10">
              <div className="max-w-[230px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Nenasala Student LMS</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-[var(--color-text-primary)]">
                  Learn anywhere. Keep moving forward.
                </h2>
              </div>
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-[var(--color-primary)] text-[var(--color-static-white)] shadow-lg sm:h-28 sm:w-28">
                <GraduationCap className="h-11 w-11 sm:h-12 sm:w-12" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isSignUp ? "signup" : "login"}
                initial={{ opacity: 0, x: isSignUp ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignUp ? -60 : 60 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                {isSignUp ? signupForm : loginForm}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
