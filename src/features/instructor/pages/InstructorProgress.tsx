import type { AdminStudentProgressRecord } from "@/lib/services/progress";

function last(value: string | null) {
  if (!value) return "No activity";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function InstructorProgress({ rows }: { rows: AdminStudentProgressRecord[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Student Progress</h1>
        <p className="mt-1 text-text-secondary">Learning activity and assessment performance for students you teach.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-text-secondary">No student progress is available yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface p-1">
          <div className="overflow-hidden rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-background">
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Lessons</th>
                  <th className="px-4 py-3">Recordings</th>
                  <th className="px-4 py-3">Assignments</th>
                  <th className="px-4 py-3">Assignment Avg.</th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3">Quiz Avg.</th>
                  <th className="px-4 py-3">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.student_id} className="border-b border-border/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{row.student_name}</p>
                      <p className="text-xs text-text-muted">{row.student_number} · {row.intake_name ?? "Intake"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.lessons_completed}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.recordings_completed}</td>
                    <td className="px-4 py-3 text-text-secondary">{row.assignments_graded}/{row.assignments_submitted} graded</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.assignment_average == null ? "—" : `${row.assignment_average}%`}</td>
                    <td className="px-4 py-3 text-text-secondary">{row.quizzes_passed}/{row.quiz_attempts} passed</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.quiz_average == null ? "—" : `${row.quiz_average}%`}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{last(row.last_activity_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
