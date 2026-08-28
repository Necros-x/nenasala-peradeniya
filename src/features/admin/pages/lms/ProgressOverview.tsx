import { BookOpenCheck, Film, TrendingUp, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import type { AdminStudentProgressRecord } from "@/lib/services/progress";

function formatActivity(value: string | null) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function ProgressOverview({ rows }: { rows: AdminStudentProgressRecord[] }) {
  const studentsStarted = rows.filter((row) => row.lessons_completed > 0 || row.recordings_completed > 0 || row.last_activity_at).length;
  const lessonsCompleted = rows.reduce((total, row) => total + row.lessons_completed, 0);
  const recordingsCompleted = rows.reduce((total, row) => total + row.recordings_completed, 0);

  const stats = [
    { label: "Students started", value: studentsStarted, icon: UsersRound },
    { label: "Lessons completed", value: lessonsCompleted, icon: BookOpenCheck },
    { label: "Recordings completed", value: recordingsCompleted, icon: Film },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Learning Progress</h1>
        <p className="mt-1 text-text-secondary">Track completed lessons, watched recordings and each student&apos;s latest learning activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-brand-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <TrendingUp className="h-5 w-5 text-brand-primary" />
          <div>
            <h2 className="font-semibold text-foreground">Student activity</h2>
            <p className="text-sm text-text-secondary">Progress recorded from real LMS lesson and recording completion.</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <CardContent className="p-10 text-center">
            <p className="font-semibold text-foreground">No students to report yet</p>
            <p className="mt-1 text-sm text-text-secondary">Progress will appear after students are registered and begin learning.</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Programme / Intake</th>
                  <th className="px-5 py-3 text-center font-semibold">Lessons</th>
                  <th className="px-5 py-3 text-center font-semibold">Recordings</th>
                  <th className="px-5 py-3 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.student_id} className="bg-surface">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{row.student_name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{row.student_number}</p>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      <p>{row.programme_name ?? "No programme"}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{row.intake_name ?? "No intake"}</p>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-foreground">{row.lessons_completed}</td>
                    <td className="px-5 py-4 text-center font-semibold text-foreground">{row.recordings_completed}</td>
                    <td className="px-5 py-4 text-text-secondary">{formatActivity(row.last_activity_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
