"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  FileQuestion,
  ListChecks,
  Plus,
  RotateCcw,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/admin/components/ui/dialog";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import {
  addQuizQuestionsBatchAction,
  deleteQuizQuestionAction,
  enableQuizRetryAction,
  moveQuizQuestionAction,
  saveQuizAction,
  saveQuizQuestionAction,
} from "@/lib/actions/admin/quizzes";
import type { ClassRecord } from "@/lib/services/classes";
import type {
  AdminQuizAttemptRecord,
  AdminQuizQuestionRecord,
  AdminQuizRecord,
  QuizQuestionType,
  QuizStatus,
} from "@/lib/services/quizzes";

type Props = {
  classes: ClassRecord[];
  quizzes: AdminQuizRecord[];
  questions: AdminQuizQuestionRecord[];
  attempts: AdminQuizAttemptRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
};

type QuestionDraft = {
  question_type: QuizQuestionType;
  prompt: string;
  options: string[];
  correct_indexes: number[];
  true_false_correct: "true" | "false";
  points: string;
};

function blankQuestion(type: QuizQuestionType = "multiple_choice"): QuestionDraft {
  return {
    question_type: type,
    prompt: "",
    options: ["", "", "", ""],
    correct_indexes: [],
    true_false_correct: "true",
    points: "1",
  };
}

function draftFromQuestion(question: AdminQuizQuestionRecord): QuestionDraft {
  const options = question.question_type === "multiple_choice" ? question.options : ["True", "False"];
  return {
    question_type: question.question_type,
    prompt: question.prompt,
    options: options.length >= 2 ? options : ["", ""],
    correct_indexes: question.question_type === "multiple_choice"
      ? options.flatMap((option, index) => question.correct_answers.includes(option) ? [index] : [])
      : [],
    true_false_correct: question.correct_answers[0]?.toLowerCase() === "false" ? "false" : "true",
    points: String(question.points),
  };
}

function serializeQuestion(question: QuestionDraft) {
  const options = question.question_type === "multiple_choice"
    ? question.options.map((option) => option.trim())
    : ["True", "False"];
  const correctAnswers = question.question_type === "multiple_choice"
    ? question.correct_indexes.map((index) => options[index]).filter(Boolean)
    : [question.true_false_correct];

  return {
    question_type: question.question_type,
    prompt: question.prompt.trim(),
    options,
    correct_answers: correctAnswers,
    points: Number(question.points || "1"),
  };
}

function QuestionEditor({
  value,
  onChange,
  number,
  canRemove,
  onRemove,
}: {
  value: QuestionDraft;
  onChange: (value: QuestionDraft) => void;
  number: number;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  function setType(type: QuizQuestionType) {
    onChange({
      ...value,
      question_type: type,
      correct_indexes: [],
      true_false_correct: "true",
      options: type === "multiple_choice" ? (value.options.length >= 2 ? value.options : ["", "", "", ""]) : ["True", "False"],
    });
  }

  function updateOption(index: number, option: string) {
    const options = [...value.options];
    options[index] = option;
    onChange({ ...value, options });
  }

  function toggleCorrect(index: number) {
    const selected = value.correct_indexes.includes(index);
    onChange({
      ...value,
      correct_indexes: selected
        ? value.correct_indexes.filter((item) => item !== index)
        : [...value.correct_indexes, index].sort((a, b) => a - b),
    });
  }

  function removeOption(index: number) {
    if (value.options.length <= 2) return;
    const options = value.options.filter((_, optionIndex) => optionIndex !== index);
    const correctIndexes = value.correct_indexes
      .filter((item) => item !== index)
      .map((item) => item > index ? item - 1 : item);
    onChange({ ...value, options, correct_indexes: correctIndexes });
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-background p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-bold text-brand-primary">Q{number}</div>
          <div>
            <p className="font-semibold text-foreground">Question {number}</p>
            <p className="text-xs text-text-muted">{value.question_type === "multiple_choice" ? "Multiple choice" : "True / False"}</p>
          </div>
        </div>
        {canRemove && onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="mr-2 h-4 w-4 text-danger" /> Remove
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
        <div>
          <Label>Question type</Label>
          <select
            value={value.question_type}
            onChange={(event) => setType(event.target.value as QuizQuestionType)}
            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="multiple_choice">Multiple choice</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
        <div>
          <Label>Points</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={value.points}
            onChange={(event) => onChange({ ...value, points: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>Question</Label>
        <textarea
          value={value.prompt}
          onChange={(event) => onChange({ ...value, prompt: event.target.value })}
          rows={3}
          className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm"
          placeholder="Type the question..."
        />
      </div>

      {value.question_type === "multiple_choice" ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label>Options</Label>
            <p className="mt-1 text-xs text-text-muted">Tick every option that should count as correct. You can select more than one.</p>
          </div>
          {value.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <label className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${value.correct_indexes.includes(optionIndex) ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface text-text-secondary"}`}>
                <input
                  type="checkbox"
                  checked={value.correct_indexes.includes(optionIndex)}
                  onChange={() => toggleCorrect(optionIndex)}
                  className="h-4 w-4 accent-[var(--color-success)]"
                />
                Correct
              </label>
              <Input
                value={option}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)} disabled={value.options.length <= 2}>
                <Trash2 className="h-4 w-4 text-text-muted" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, options: [...value.options, ""] })}>
            <Plus className="mr-2 h-4 w-4" /> Add option
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Label>Correct answer</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["true", "false"] as const).map((answer) => (
              <label key={answer} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm font-semibold ${value.true_false_correct === answer ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface text-text-secondary"}`}>
                <input
                  type="radio"
                  checked={value.true_false_correct === answer}
                  onChange={() => onChange({ ...value, true_false_correct: answer })}
                  className="h-4 w-4 accent-[var(--color-success)]"
                />
                {answer === "true" ? "True" : "False"}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function quizVariant(status: QuizStatus): "secondary" | "success" | "warning" | "outline" {
  if (status === "published") return "success";
  if (status === "closed") return "warning";
  if (status === "archived") return "outline";
  return "secondary";
}

function attemptVariant(item: AdminQuizAttemptRecord): "secondary" | "success" | "danger" | "warning" | "info" {
  if (item.status === "in_progress") return "info";
  if (item.passed) return "success";
  if (item.timed_out) return "warning";
  return "danger";
}

export default function QuizzesManager({ classes, quizzes, questions, attempts, accessKey, readOnlyDemo }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"quizzes" | "questions" | "results">("quizzes");
  const [quizOpen, setQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<AdminQuizRecord | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? "");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuizQuestionRecord | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionDraft | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([blankQuestion()]);
  const [deleteTarget, setDeleteTarget] = useState<AdminQuizQuestionRecord | null>(null);
  const [retryTarget, setRetryTarget] = useState<AdminQuizAttemptRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const activeClasses = useMemo(() => classes.filter((item) => item.status !== "cancelled"), [classes]);
  const selectedQuiz = quizzes.find((item) => item.id === selectedQuizId) ?? null;
  const selectedQuestions = questions.filter((item) => item.quiz_id === selectedQuizId).sort((a, b) => a.position - b.position);
  const submittedAttempts = attempts.filter((item) => item.status === "submitted");
  const passedCount = submittedAttempts.filter((item) => item.passed).length;

  useEffect(() => {
    if (!selectedQuizId && quizzes.length > 0) setSelectedQuizId(quizzes[0].id);
  }, [quizzes, selectedQuizId]);

  function chooseQuiz(quizId: string) {
    setSelectedQuizId(quizId);
    setDraftQuestions([blankQuestion()]);
  }

  function beginCreateQuiz() {
    setEditingQuiz(null);
    setQuizOpen(true);
  }

  function beginEditQuiz(quiz: AdminQuizRecord) {
    setEditingQuiz(quiz);
    setQuizOpen(true);
  }

  function beginEditQuestion(question: AdminQuizQuestionRecord) {
    if (selectedQuiz?.attempt_count) return toast.error("Questions are locked after the first student attempt.");
    setEditingQuestion(question);
    setEditDraft(draftFromQuestion(question));
    setQuestionOpen(true);
  }

  async function submitQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      if (editingQuiz) formData.set("id", editingQuiz.id);
      for (const key of ["publish_at", "due_at"]) {
        const raw = formData.get(key);
        if (typeof raw === "string" && raw) formData.set(key, new Date(raw).toISOString());
      }
      const result = await saveQuizAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save quiz.");
      toast.success(editingQuiz ? "Quiz updated" : "Quiz created as draft");
      setQuizOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveDraftBatch() {
    if (!selectedQuiz || readOnlyDemo) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("quiz_id", selectedQuiz.id);
      formData.set("questions_json", JSON.stringify(draftQuestions.map(serializeQuestion)));
      const result = await addQuizQuestionsBatchAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save questions.");
      toast.success(`${draftQuestions.length} question${draftQuestions.length === 1 ? "" : "s"} added`);
      setDraftQuestions([blankQuestion()]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedQuestion() {
    if (!selectedQuiz || !editingQuestion || !editDraft || readOnlyDemo) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("quiz_id", selectedQuiz.id);
      formData.set("id", editingQuestion.id);
      formData.set("question_json", JSON.stringify(serializeQuestion(editDraft)));
      const result = await saveQuizQuestionAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to update question.");
      toast.success("Question updated");
      setQuestionOpen(false);
      setEditingQuestion(null);
      setEditDraft(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function moveQuestion(question: AdminQuizQuestionRecord, direction: "up" | "down") {
    if (readOnlyDemo) return;
    const formData = new FormData();
    formData.set("accessKey", accessKey);
    formData.set("question_id", question.id);
    formData.set("direction", direction);
    const result = await moveQuizQuestionAction(formData);
    if (!result.ok) return toast.error(result.error ?? "Unable to reorder question.");
    router.refresh();
  }

  async function confirmDeleteQuestion() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("question_id", deleteTarget.id);
      const result = await deleteQuizQuestionAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to delete question.");
      toast.success("Question deleted");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmRetry() {
    if (!retryTarget) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("quiz_id", retryTarget.quiz_id);
      formData.set("student_id", retryTarget.student_id);
      const result = await enableQuizRetryAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to enable retry.");
      toast.success("One additional quiz attempt enabled and student notified");
      setRetryTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quizzes & Automatic Scoring</h1>
          <p className="mt-1 text-text-secondary">Build class quizzes, keep answer keys server-only, and review automatically scored attempts.</p>
        </div>
        <Button onClick={beginCreateQuiz} disabled={readOnlyDemo || activeClasses.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> New Quiz
        </Button>
      </div>

      {readOnlyDemo && <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">Demo mode is read-only.</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><FileQuestion className="h-6 w-6 text-brand-primary" /><div><p className="text-2xl font-bold">{quizzes.length}</p><p className="text-sm text-text-secondary">Quizzes</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><UsersRound className="h-6 w-6 text-info" /><div><p className="text-2xl font-bold">{submittedAttempts.length}</p><p className="text-sm text-text-secondary">Completed attempts</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><CheckCircle2 className="h-6 w-6 text-success" /><div><p className="text-2xl font-bold">{passedCount}</p><p className="text-sm text-text-secondary">Passed attempts</p></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <Button variant={tab === "quizzes" ? "default" : "ghost"} onClick={() => setTab("quizzes")}>Quizzes</Button>
        <Button variant={tab === "questions" ? "default" : "ghost"} onClick={() => setTab("questions")}>Question Builder</Button>
        <Button variant={tab === "results" ? "default" : "ghost"} onClick={() => setTab("results")}>Results</Button>
      </div>

      {tab === "quizzes" ? (
        quizzes.length === 0 ? (
          <Card><CardContent className="p-10 text-center"><FileQuestion className="mx-auto mb-3 h-8 w-8 text-brand-primary" /><h2 className="font-semibold">No quizzes yet</h2><p className="mt-1 text-sm text-text-secondary">Create a draft quiz, add questions, then publish it.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={quizVariant(quiz.status)}>{quiz.status}</Badge><span className="text-xs text-text-muted">{quiz.question_count} questions • {quiz.total_points} pts</span></div>
                      <h2 className="text-lg font-semibold text-foreground">{quiz.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{quiz.course_title} • {quiz.class_name}</p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted"><span>Pass: {quiz.pass_percentage}%</span><span>{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "Untimed"}</span><span>Due: {formatDate(quiz.due_at)}</span></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => beginEditQuiz(quiz)} disabled={readOnlyDemo}><Edit2 className="mr-2 h-4 w-4" /> Edit</Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { chooseQuiz(quiz.id); setTab("questions"); }}><ListChecks className="mr-2 h-4 w-4" /> Manage Questions</Button>
                    {quiz.attempt_count > 0 && <Badge variant="outline">Questions locked • {quiz.attempt_count} attempt{quiz.attempt_count === 1 ? "" : "s"}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : tab === "questions" ? (
        <div className="space-y-4">
          <Card><CardContent className="p-5">
            <Label htmlFor="quiz-builder-select">Quiz</Label>
            <select id="quiz-builder-select" value={selectedQuizId} onChange={(event) => chooseQuiz(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title} — {quiz.class_name}</option>)}
            </select>
            {selectedQuiz && <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-secondary"><span>{selectedQuiz.question_count} questions</span><span>•</span><span>{selectedQuiz.total_points} total points</span><span>•</span><span>Pass mark {selectedQuiz.pass_percentage}%</span></div>}
          </CardContent></Card>

          {!selectedQuiz ? (
            <Card><CardContent className="p-10 text-center text-text-secondary">Create a quiz first.</CardContent></Card>
          ) : selectedQuiz.attempt_count > 0 ? (
            <Card><CardContent className="p-5 text-sm text-warning">Question editing is locked because a student has already started this quiz.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="space-y-5 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add questions</h2>
                  <p className="mt-1 text-sm text-text-secondary">Build Q1, Q2, Q3… in one go. Add as many questions as you need, then save them together.</p>
                </div>
                {draftQuestions.map((draft, index) => (
                  <QuestionEditor
                    key={index}
                    value={draft}
                    number={selectedQuestions.length + index + 1}
                    canRemove={draftQuestions.length > 1}
                    onRemove={() => setDraftQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    onChange={(next) => setDraftQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? next : item))}
                  />
                ))}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setDraftQuestions((current) => [...current, blankQuestion()])} disabled={saving || readOnlyDemo}>
                    <Plus className="mr-2 h-4 w-4" /> Add another question
                  </Button>
                  <Button type="button" onClick={saveDraftBatch} disabled={saving || readOnlyDemo}>
                    {saving ? "Saving..." : `Save ${draftQuestions.length} new question${draftQuestions.length === 1 ? "" : "s"}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedQuiz && selectedQuestions.length > 0 && (
            <div className="space-y-3">
              <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-text-muted">Saved questions</h2>
              {selectedQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] font-bold text-brand-primary">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{question.question_type === "multiple_choice" ? "Multiple choice" : "True / False"}</Badge>
                          <span className="text-xs text-text-muted">{question.points} pts</span>
                          {question.correct_answers.length > 1 && <Badge variant="success">{question.correct_answers.length} correct options</Badge>}
                        </div>
                        <p className="mt-3 font-medium text-foreground">{question.prompt}</p>
                        {question.question_type === "multiple_choice" ? (
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            {question.options.map((option) => {
                              const correct = question.correct_answers.includes(option);
                              return <span key={option} className={`rounded-md border px-3 py-2 ${correct ? "border-success/30 bg-success/10 font-semibold text-success" : "border-border text-text-secondary"}`}>{correct ? "✓" : "•"} {option}</span>;
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-success">Correct answer: {question.correct_answers[0]?.toLowerCase() === "false" ? "False" : "True"}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                        <Button size="icon" variant="ghost" disabled={readOnlyDemo || index === 0 || Boolean(selectedQuiz.attempt_count)} onClick={() => moveQuestion(question, "up")}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={readOnlyDemo || index === selectedQuestions.length - 1 || Boolean(selectedQuiz.attempt_count)} onClick={() => moveQuestion(question, "down")}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={readOnlyDemo || Boolean(selectedQuiz.attempt_count)} onClick={() => beginEditQuestion(question)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={readOnlyDemo || Boolean(selectedQuiz.attempt_count)} onClick={() => setDeleteTarget(question)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : attempts.length === 0 ? (
        <Card><CardContent className="p-10 text-center"><UsersRound className="mx-auto mb-3 h-8 w-8 text-brand-primary" /><h2 className="font-semibold">No quiz attempts yet</h2><p className="mt-1 text-sm text-text-secondary">Student results will appear here after they begin quizzes.</p></CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Attempt</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="px-5 py-4"><p className="font-semibold text-foreground">{attempt.student_name}</p><p className="text-xs text-text-muted">{attempt.student_number}</p></td>
                    <td className="px-5 py-4"><p className="font-medium text-foreground">{attempt.quiz_title}</p><p className="text-xs text-text-muted">{attempt.course_title}</p></td>
                    <td className="px-5 py-4">#{attempt.attempt_number}</td>
                    <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={attemptVariant(attempt)}>{attempt.status === "in_progress" ? "In progress" : attempt.passed ? "Passed" : attempt.timed_out ? "Timed out" : "Failed"}</Badge>{attempt.percentage != null && <span className="font-semibold">{attempt.percentage}%</span>}{attempt.retry_remaining > 0 && <Badge variant="warning">Retry enabled</Badge>}</div></td>
                    <td className="px-5 py-4 text-text-secondary">{formatDate(attempt.submitted_at)}</td>
                    <td className="px-5 py-4 text-right"><Button size="sm" variant="outline" onClick={() => setRetryTarget(attempt)} disabled={readOnlyDemo || saving || attempt.status !== "submitted" || attempt.retry_remaining > 0}><RotateCcw className="mr-2 h-4 w-4" /> {attempt.retry_remaining > 0 ? "Retry enabled" : "Enable retry"}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={quizOpen} onOpenChange={(open) => !saving && setQuizOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={submitQuiz}>
            <DialogHeader><DialogTitle>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle><DialogDescription>Create a draft first, add the answer-key questions, then publish it to the class.</DialogDescription></DialogHeader>
            <div className="grid gap-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Class</Label>{editingQuiz?.attempt_count ? <input type="hidden" name="class_id" value={editingQuiz.class_id} /> : null}<select name="class_id" defaultValue={editingQuiz?.class_id ?? ""} required disabled={Boolean(editingQuiz?.attempt_count)} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="" disabled>Select class</option>{activeClasses.map((item) => <option key={item.id} value={item.id}>{item.course_title} — {item.name}</option>)}</select></div>
              <div className="sm:col-span-2"><Label>Title</Label><Input name="title" defaultValue={editingQuiz?.title ?? ""} required /></div>
              <div className="sm:col-span-2"><Label>Description</Label><textarea name="description" defaultValue={editingQuiz?.description ?? ""} rows={3} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm" /></div>
              <div className="sm:col-span-2"><Label>Instructions</Label><textarea name="instructions" defaultValue={editingQuiz?.instructions ?? ""} rows={3} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm" /></div>
              <div><Label>Publish at</Label><Input type="datetime-local" name="publish_at" defaultValue={toLocalInput(editingQuiz?.publish_at)} /></div>
              <div><Label>Due at</Label><Input type="datetime-local" name="due_at" defaultValue={toLocalInput(editingQuiz?.due_at)} /></div>
              <div><Label>Time limit (minutes)</Label><Input type="number" min="1" step="1" name="time_limit_minutes" defaultValue={editingQuiz?.time_limit_minutes ?? ""} readOnly={Boolean(editingQuiz?.attempt_count)} placeholder="Leave blank for untimed" /></div>
              <div><Label>Pass percentage</Label><Input type="number" min="0" max="100" step="0.01" name="pass_percentage" defaultValue={editingQuiz?.pass_percentage ?? 60} readOnly={Boolean(editingQuiz?.attempt_count)} /></div>
              <div className="sm:col-span-2"><Label>Status</Label><select name="status" defaultValue={editingQuiz?.status ?? "draft"} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></div>
            </div>
            {editingQuiz?.attempt_count ? <p className="mb-4 text-xs text-warning">This quiz already has attempts. Class, timer, pass mark and questions are locked for scoring integrity.</p> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setQuizOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Quiz"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={questionOpen} onOpenChange={(open) => !saving && setQuestionOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit Question</DialogTitle><DialogDescription>Tick one or more correct MCQ options. Students only see whether multiple selection is allowed—not the answer key.</DialogDescription></DialogHeader>
          <div className="py-5">
            {editDraft && <QuestionEditor value={editDraft} number={(editingQuestion?.position ?? 0) + 1} onChange={setEditDraft} />}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setQuestionOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveEditedQuestion} disabled={saving || !editDraft}>{saving ? "Saving..." : "Save Question"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !saving && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Delete question?</DialogTitle><DialogDescription>This removes the question and reorders the remaining questions. This cannot be done after students start the quiz.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button><Button onClick={confirmDeleteQuestion} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={Boolean(retryTarget)} onOpenChange={(open) => !open && !saving && setRetryTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><div className="mb-3 grid h-12 w-12 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-brand-primary"><RotateCcw className="h-5 w-5" /></div><DialogTitle>Enable one more attempt?</DialogTitle><DialogDescription>{retryTarget ? `${retryTarget.student_name} will receive permission for exactly one additional attempt on “${retryTarget.quiz_title}” and will be notified.` : ""}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRetryTarget(null)} disabled={saving}>Cancel</Button><Button onClick={confirmRetry} disabled={saving}>{saving ? "Enabling..." : "Enable & Notify"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
