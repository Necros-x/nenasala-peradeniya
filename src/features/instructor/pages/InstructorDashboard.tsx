import Link from "next/link";
import { BookOpen, CalendarClock, ClipboardCheck, FileQuestion, UsersRound } from "lucide-react";
import type { AwaitedReturn } from "@/features/instructor/types";

function fmt(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function InstructorDashboard({
  data,
  basePath = "/instructor",
}: {
  data: AwaitedReturn;
  basePath?: string;
}) {
  const firstName = data.profile?.full_name.split(/\s+/)[0] ?? "Instructor";
  const stats = [
    { label: "Assigned Classes", value: data.classes.length, icon: BookOpen },
    { label: "Students", value: data.students.length, icon: UsersRound },
    { label: "Awaiting Grading", value: data.pendingSubmissions.length, icon: ClipboardCheck },
    { label: "Quiz Attempts", value: data.completedQuizAttempts.length, icon: FileQuestion },
  ];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">Instructor Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Welcome, {firstName}</h1>
        <p className="mt-1 text-text-secondary">Classes, grading queue and upcoming sessions in one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
              <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                <Icon className="h-5 w-5 text-brand-primary" />
                <p className="mt-5 text-3xl font-bold text-text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Grading queue</h2>
              <Link href={`${basePath}/assignments`} className="text-sm font-semibold text-brand-primary hover:underline">Open assignments</Link>
            </div>

            {data.pendingSubmissions.length === 0 ? (
              <p className="mt-5 text-sm text-text-secondary">No submitted assignments are waiting for grading.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {data.pendingSubmissions.slice(0, 5).map((submission) => (
                  <Link key={submission.id} href={`${basePath}/assignments`} className="block rounded-md border border-border bg-background p-3 hover:border-brand-primary">
                    <p className="font-semibold text-text-primary">{submission.student_name}</p>
                    <p className="mt-1 text-xs text-text-secondary">{submission.assignment_title} · {submission.course_title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                <CalendarClock className="h-5 w-5 text-brand-primary" /> Upcoming sessions
              </h2>
              <Link href={`${basePath}/recordings`} className="text-sm font-semibold text-brand-primary hover:underline">Media</Link>
            </div>

            {data.upcomingSessions.length === 0 ? (
              <p className="mt-5 text-sm text-text-secondary">No upcoming live sessions are scheduled.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {data.upcomingSessions.map((session) => (
                  <div key={session.id} className="rounded-md border border-border bg-background p-3">
                    <p className="font-semibold text-text-primary">{session.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{fmt(session.starts_at)} · {session.status}</p>
                    {session.join_url && (
                      <a href={session.join_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-brand-primary hover:underline">
                        Open meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
