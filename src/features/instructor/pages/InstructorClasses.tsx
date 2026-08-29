import type { ClassRecord } from "@/lib/services/classes";
import type { AdminStudentRecord } from "@/lib/services/students";

function date(value: string | null) {
  if (!value) return "TBA";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export default function InstructorClasses({
  classes,
  students,
}: {
  classes: ClassRecord[];
  students: AdminStudentRecord[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">My Classes</h1>
        <p className="mt-1 text-text-secondary">Classes assigned to your lecturer account.</p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-text-secondary">
          No classes have been assigned to you yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {classes.map((classRow) => {
            const count = students.filter((student) => student.intake_id === classRow.intake_id).length;
            return (
              <article key={classRow.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">{classRow.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-brand-primary">{classRow.course_title}</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold capitalize text-brand-primary">{classRow.status}</span>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div><p className="text-xs text-text-muted">Programme</p><p className="font-semibold text-text-primary">{classRow.programme_name}</p></div>
                    <div><p className="text-xs text-text-muted">Intake</p><p className="font-semibold text-text-primary">{classRow.intake_name}</p></div>
                    <div><p className="text-xs text-text-muted">Schedule</p><p className="font-semibold text-text-primary">{date(classRow.start_date)} → {date(classRow.end_date)}</p></div>
                    <div><p className="text-xs text-text-muted">Students</p><p className="font-semibold text-text-primary">{count}</p></div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
