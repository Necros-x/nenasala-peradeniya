"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileQuestion, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/features/student/components/ui/Card";
import { Button } from "@/features/student/components/ui/Button";
import { Badge } from "@/features/student/components/ui/Badge";
import { startQuizAttemptAction, submitQuizAttemptAction } from "@/lib/actions/student/quizzes";
import type { StudentQuizSessionData } from "@/lib/services/quizzes";

type ActiveAttempt = NonNullable<StudentQuizSessionData["attempt"]>;
type Result = {
  percentage: number;
  score_points: number;
  max_points: number;
  passed: boolean;
  timed_out: boolean;
  attempt_number: number;
};

function secondsUntil(value: string | null | undefined) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
}

function timerLabel(seconds: number | null) {
  if (seconds === null) return "Untimed";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function RealQuizSession({ initialData }: { initialData: StudentQuizSessionData | null }) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveAttempt | null>(initialData?.attempt ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>(initialData?.attempt?.initial_answers ?? {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState<number | null>(() => secondsUntil(initialData?.attempt?.expires_at));
  const submitLock = useRef(false);

  useEffect(() => {
    submitLock.current = false;
    setRemaining(secondsUntil(active?.expires_at));
    if (!active?.expires_at) return;

    const interval = window.setInterval(() => {
      setRemaining(secondsUntil(active.expires_at));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active?.id, active?.expires_at]);

  useEffect(() => {
    if (active?.expires_at && remaining === 0 && !result && !submitting && !submitLock.current) {
      void handleSubmit();
    }
  }, [remaining, active?.expires_at, result, submitting]);

  if (!initialData) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <FileQuestion className="mx-auto mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Quiz unavailable</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">This quiz may not be published for your class or you may no longer have access.</p>
        <Link href="/student/quizzes" className="mt-6 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold">Back to Quizzes</Link>
      </div>
    );
  }

  const quiz = initialData.quiz;
  const questions = active?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((key) => Boolean(answers[key])).length;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const response = await startQuizAttemptAction(quiz.id);
      if (!response.ok) {
        setError(response.error ?? "Unable to start quiz.");
        router.refresh();
        return;
      }
      if (response.result) {
        setResult(response.result);
        router.refresh();
        return;
      }
      if (response.session) {
        setActive(response.session);
        setAnswers(response.session.initial_answers ?? {});
        setCurrentIndex(0);
      }
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (!active || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitQuizAttemptAction(active.id, answers);
      if (!response.ok || !response.result) {
        setError(response.error ?? "Unable to submit quiz.");
        submitLock.current = false;
        return;
      }
      setResult(response.result);
      setActive(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-8">
        <Card className="p-8 text-center sm:p-12">
          <div className={`mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full ${result.passed ? "bg-[var(--color-success-soft)]" : "bg-[var(--color-error-soft)]"}`}>
            {result.passed ? <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" /> : <AlertCircle className="h-10 w-10 text-[var(--color-error)]" />}
          </div>
          <Badge variant={result.passed ? "success" : "error"}>{result.passed ? "Passed" : result.timed_out ? "Timed out" : "Failed"}</Badge>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">{quiz.title}</h1>
          <div className="mt-6 text-5xl font-black text-[var(--color-text-primary)]">{result.percentage}%</div>
          <p className="mt-2 text-[var(--color-text-secondary)]">{result.score_points} of {result.max_points} points • Attempt {result.attempt_number}</p>
          {result.timed_out && <p className="mt-4 text-sm text-[var(--color-warning)]">The quiz was submitted after the timer expired. Answers received by the server were still scored.</p>}
          <div className="mt-8 flex justify-center">
            <Link href="/student/quizzes"><Button variant="outline">Back to Quizzes</Button></Link>
          </div>
          {!result.passed && quiz.retry_remaining === 0 && <p className="mt-5 text-xs text-[var(--color-text-muted)]">Another attempt stays locked until an admin or your lecturer explicitly enables a retry.</p>}
        </Card>
      </div>
    );
  }

  if (!active) {
    const latest = quiz.latest_attempt;
    const duePassed = quiz.due_at ? new Date(quiz.due_at).getTime() < Date.now() : false;
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" /> Back to quizzes</Link>
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2"><Badge variant="default">{quiz.course_title}</Badge>{quiz.retry_remaining > 0 && <Badge variant="warning">One retry available</Badge>}</div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{quiz.title}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{quiz.class_name}</p>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            {quiz.description && <p className="leading-relaxed text-[var(--color-text-secondary)]">{quiz.description}</p>}
            {quiz.instructions && <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Instructions</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{quiz.instructions}</p></div>}

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-4"><p className="text-xs text-[var(--color-text-muted)]">Questions</p><p className="mt-1 font-bold">{quiz.question_count}</p></div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-4"><p className="text-xs text-[var(--color-text-muted)]">Total points</p><p className="mt-1 font-bold">{quiz.total_points}</p></div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-4"><p className="text-xs text-[var(--color-text-muted)]">Pass mark</p><p className="mt-1 font-bold">{quiz.pass_percentage}%</p></div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-4"><p className="text-xs text-[var(--color-text-muted)]">Time</p><p className="mt-1 font-bold">{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "Untimed"}</p></div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Deadline: {formatDate(quiz.due_at)}</p>

            {latest && (
              <div className={`rounded-[var(--radius-md)] border p-5 ${latest.passed ? "border-[var(--color-success)]/25 bg-[var(--color-success-soft)]" : "border-[var(--color-error)]/20 bg-[var(--color-error-soft)]"}`}>
                <div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-[var(--color-text-primary)]">Latest result • Attempt {latest.attempt_number}</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{latest.score_points}/{latest.max_points} points</p></div><span className={`text-3xl font-black ${latest.passed ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>{latest.percentage}%</span></div>
              </div>
            )}

            {error && <div className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] p-3 text-sm text-[var(--color-error)]">{error}</div>}

            {quiz.can_start ? (
              <Button className="w-full sm:w-auto" onClick={handleStart} disabled={starting}>
                {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : quiz.retry_remaining > 0 ? <><RotateCcw className="mr-2 h-4 w-4" /> Start Retry</> : "Start Quiz"}
              </Button>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-sm text-[var(--color-text-secondary)]">
                {latest ? "This attempt is locked. Another attempt must be enabled by an admin or your lecturer." : duePassed ? "The quiz deadline has passed." : "This quiz is not open for attempts."}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="mx-auto max-w-3xl py-16 text-center text-[var(--color-text-secondary)]">Quiz questions are unavailable.</div>;
  }

  const isLast = currentIndex === questions.length - 1;
  const timerCritical = remaining !== null && remaining <= 60;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-[var(--color-text-secondary)]">Attempt {active.attempt_number}</p><h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{quiz.title}</h1></div>
        <div className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-bold ${timerCritical ? "border-[var(--color-error)]/30 bg-[var(--color-error-soft)] text-[var(--color-error)]" : "border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"}`}><Clock3 className="h-4 w-4" /> {timerLabel(remaining)}</div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs font-semibold text-[var(--color-text-muted)]"><span>Question {currentIndex + 1} of {questions.length}</span><span>{answeredCount} answered</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]"><div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4"><h2 className="text-lg font-semibold leading-relaxed text-[var(--color-text-primary)]">{currentQuestion.prompt}</h2><Badge variant="secondary">{currentQuestion.points} pts</Badge></div>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === (currentQuestion.question_type === "true_false" ? option.toLowerCase() : option);
            const value = currentQuestion.question_type === "true_false" ? option.toLowerCase() : option;
            return (
              <button key={option} type="button" onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: value }))} className={`w-full rounded-[var(--radius-md)] border-2 p-4 text-left transition-colors ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/60" : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary-muted)]"}`}>
                <span className="flex items-center gap-3"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-[var(--color-primary)]" : "border-[var(--color-border-strong)]"}`}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />}</span><span className="text-sm font-medium text-[var(--color-text-primary)]">{option}</span></span>
              </button>
            );
          })}
        </div>
      </Card>

      {error && <div className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] p-3 text-sm text-[var(--color-error)]">{error}</div>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0 || submitting}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit Quiz</>}</Button>
        ) : (
          <Button onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={submitting}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
