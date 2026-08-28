import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { StudentAssignmentRecord } from "@/lib/services/assignments";

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

function state(item: StudentAssignmentRecord) {
  const submission = item.submission;
  if (submission?.status === "graded") return { label: "Graded", variant: "success" as const, icon: CheckCircle2 };
  if (submission?.status === "returned") return { label: "Needs revision", variant: "warning" as const, icon: RotateCcw };
  if (submission?.status === "late") return { label: "Submitted late", variant: "error" as const, icon: ClipboardList };
  if (submission?.status === "submitted") return { label: "Submitted", variant: "default" as const, icon: ClipboardList };
  if (item.due_at && new Date(item.due_at).getTime() < Date.now()) return { label: "Overdue", variant: "error" as const, icon: CalendarClock };
  return { label: "Not submitted", variant: "secondary" as const, icon: ClipboardList };
}

export default function RealAssignments({ assignments }: { assignments: StudentAssignmentRecord[] }) {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Assignments</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Assignments released to your active classes.</p>
      </div>

      {assignments.length === 0 ? (
        <Card className="p-10 text-center">
          <ClipboardList className="mx-auto mb-3 h-9 w-9 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No assignments yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Published assignments will appear here automatically.</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {assignments.map((item) => {
            const status = state(item);
            const Icon = status.icon;
            return (
              <Link key={item.id} href={`/student/assignments/${item.id}`}>
                <Card className="h-full p-5 transition-colors hover:border-[var(--color-primary)]">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">{item.max_points} pts</span>
                      </div>
                      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{item.title}</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.course_title} • {item.class_name}</p>
                      {item.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.description}</p>}
                      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                        <span>Due {formatDate(item.due_at)}</span>
                        {item.submission?.status === "graded" && <span>{item.submission.score ?? 0}/{item.max_points}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
