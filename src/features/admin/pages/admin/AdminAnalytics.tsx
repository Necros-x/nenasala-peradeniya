"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Presentation,
  UsersRound,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminAnalyticsData, AnalyticsRange } from "@/lib/services/admin-analytics";

const ranges: Array<{ value: AnalyticsRange; label: string }> = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

function pct(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < hour) return `${Math.max(1, Math.floor(delta / minute))}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  borderColor: "var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-primary)",
};

export default function AdminAnalytics({ data }: { data: AdminAnalyticsData }) {
  const pathname = usePathname();
  const router = useRouter();

  function changeRange(value: AnalyticsRange) {
    router.push(`${pathname}?range=${value}`);
  }

  function downloadCsv() {
    const rows: Array<Array<string | number>> = [
      ["Nenasala Peradeniya Analytics"],
      ["Period", `${data.rangeDays} days`],
      ["Generated", data.generatedAt],
      [],
      ["Headline"],
      ["Students", data.headline.students],
      ["Active learners", data.headline.activeLearners],
      ["Enrollments", data.headline.enrollments],
      ["Enrollment completion rate", `${data.headline.completionRate}%`],
      ["Active classes", data.headline.activeClasses],
      ["Published courses", data.headline.publishedCourses],
      ["Instructors", data.headline.instructors],
      ["Certificates issued", data.headline.certificatesIssued],
      [],
      ["Course performance"],
      ["Course", "Learners", "Classes", "Assignment average", "Quiz average", "Quiz pass rate"],
      ...data.courses.map((course) => [
        course.title,
        course.learners,
        course.classes,
        course.assignmentAverage ?? "",
        course.quizAverage ?? "",
        course.quizPassRate ?? "",
      ]),
      [],
      ["Programme enrollment"],
      ["Programme", "Enrollments", "Active", "Completed", "Capacity", "Utilisation"],
      ...data.programmes.map((programme) => [
        programme.name,
        programme.enrollments,
        programme.active,
        programme.completed,
        programme.capacity,
        programme.utilisation ?? "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nenasala-analytics-${data.rangeDays}d.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (!data.available) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">Analytics</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Institution Analytics</h1>
          <p className="mt-1 text-text-secondary">Live institutional data is hidden in demo or preview sessions.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-brand-primary" />
            <p className="mt-4 font-semibold text-text-primary">Live analytics unavailable</p>
            <p className="mt-1 text-sm text-text-secondary">Sign in with a real Admin or Super Admin account to view reporting data.</p>
          </div>
        </div>
      </div>
    );
  }

  const assessmentChart = [
    {
      name: "Assignments",
      average: data.period.assignmentAverage ?? 0,
      outcome:
        data.period.assignmentSubmissions > 0
          ? Math.round((data.period.gradedAssignments / data.period.assignmentSubmissions) * 100)
          : 0,
    },
    {
      name: "Quizzes",
      average: data.period.quizAverage ?? 0,
      outcome: data.period.quizPassRate ?? 0,
    },
  ];

  const snapshotCards = [
    { label: "Students", value: data.headline.students, detail: `${data.headline.activeLearners} active learners`, icon: UsersRound },
    { label: "Enrollments", value: data.headline.enrollments, detail: `${data.headline.completionRate}% completed`, icon: GraduationCap },
    { label: "Active Classes", value: data.headline.activeClasses, detail: `${data.headline.publishedCourses} published courses`, icon: BookOpen },
    { label: "Instructors", value: data.headline.instructors, detail: `${data.headline.certificatesIssued} certificates issued`, icon: Presentation },
  ];

  const periodCards = [
    { label: "New enrollments", value: data.period.newEnrollments, icon: GraduationCap },
    { label: "Engaged learners", value: data.period.engagedLearners, icon: Activity },
    { label: "Lesson completions", value: data.period.lessonCompletions, icon: CheckCircle2 },
    { label: "Recording completions", value: data.period.recordingCompletions, icon: Video },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">Analytics</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Institution Analytics</h1>
          <p className="mt-1 max-w-3xl text-text-secondary">
            Real enrollment, engagement, assessment, instructor and credential performance from the LMS database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-[var(--radius-md)] border border-border bg-surface p-1">
            {ranges.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => changeRange(range.value)}
                className={`rounded-[calc(var(--radius-md)-4px)] px-3 py-2 text-xs font-bold transition-colors ${
                  data.rangeDays === range.value
                    ? "bg-brand-primary text-[var(--color-static-white)]"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-bold text-text-primary transition-colors hover:bg-surface-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Institution snapshot</h2>
            <p className="text-xs text-text-muted">Current totals; these do not change with the date filter.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {snapshotCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-secondary">{card.label}</p>
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-background text-brand-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold text-text-primary">{card.value}</p>
                  <p className="mt-1 text-xs text-text-muted">{card.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-text-primary">Selected period</h2>
          <p className="text-xs text-text-muted">Activity recorded during the last {data.rangeDays} days.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {periodCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
                <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
                  <Icon className="h-4 w-4 text-brand-primary" />
                  <p className="mt-4 text-2xl font-bold text-text-primary">{card.value}</p>
                  <p className="mt-1 text-sm text-text-secondary">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Enrollment trend</h2>
              <p className="mt-1 text-xs text-text-muted">New and completed enrollments during the selected period.</p>
            </div>
            <div className="mt-5 h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.enrollmentTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsEnrollment" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-text-muted)" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#analyticsEnrollment)" />
                  <Area type="monotone" dataKey="completions" name="Completions" stroke="var(--color-success)" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <h2 className="text-lg font-bold text-text-primary">Enrollment status</h2>
            <p className="mt-1 text-xs text-text-muted">Current status across all enrollment records.</p>

            <div className="mt-5 space-y-4">
              {data.enrollmentStatuses.length === 0 ? (
                <p className="text-sm text-text-secondary">No enrollment data yet.</p>
              ) : (
                data.enrollmentStatuses.map((item) => {
                  const maximum = Math.max(...data.enrollmentStatuses.map((row) => row.count), 1);
                  return (
                    <div key={item.status}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-text-primary">{titleCase(item.status)}</span>
                        <span className="text-text-muted">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{ width: `${Math.max(4, (item.count / maximum) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Assessment performance</h2>
                <p className="mt-1 text-xs text-text-muted">Averages and completion/pass outcomes for the selected period.</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-brand-primary" />
            </div>

            <div className="mt-5 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-text-muted)" />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="average" name="Average %" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outcome" name="Outcome %" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs text-text-muted">Assignments graded</p>
                <p className="mt-1 text-xl font-bold text-text-primary">{data.period.gradedAssignments}/{data.period.assignmentSubmissions}</p>
                <p className="mt-1 text-xs text-text-secondary">Average {pct(data.period.assignmentAverage)}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs text-text-muted">Quiz attempts</p>
                <p className="mt-1 text-xl font-bold text-text-primary">{data.period.quizAttempts}</p>
                <p className="mt-1 text-xs text-text-secondary">{pct(data.period.quizPassRate)} pass · {pct(data.period.quizAverage)} avg.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Programme capacity</h2>
                <p className="mt-1 text-xs text-text-muted">Enrollment footprint grouped by programme and intake capacity.</p>
              </div>
              <GraduationCap className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {data.programmes.length === 0 ? (
                <p className="text-sm text-text-secondary">No programme data yet.</p>
              ) : (
                data.programmes.slice(0, 8).map((programme) => (
                  <div key={programme.id} className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">{programme.name}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {programme.active} active · {programme.completed} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">{programme.enrollments}</p>
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">Enrollments</p>
                      </div>
                    </div>
                    {programme.utilisation != null && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[10px] text-text-muted">
                          <span>Capacity use</span>
                          <span>{programme.utilisation}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, programme.utilisation)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Course performance</h2>
              <p className="mt-1 text-xs text-text-muted">Current learner footprint with assessment results from the selected period.</p>
            </div>
            <BookOpen className="h-5 w-5 text-brand-primary" />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-muted">
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Learners</th>
                  <th className="px-3 py-3">Classes</th>
                  <th className="px-3 py-3">Assignment avg.</th>
                  <th className="px-3 py-3">Quiz avg.</th>
                  <th className="px-3 py-3">Quiz pass</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((course) => (
                  <tr key={course.id} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-3 font-semibold text-text-primary">{course.title}</td>
                    <td className="px-3 py-3 text-text-secondary">{course.learners}</td>
                    <td className="px-3 py-3 text-text-secondary">{course.classes}</td>
                    <td className="px-3 py-3 font-semibold text-text-primary">{pct(course.assignmentAverage)}</td>
                    <td className="px-3 py-3 font-semibold text-text-primary">{pct(course.quizAverage)}</td>
                    <td className="px-3 py-3 font-semibold text-text-primary">{pct(course.quizPassRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Instructor workload</h2>
                <p className="mt-1 text-xs text-text-muted">Assigned classes, reachable learners and current grading queue.</p>
              </div>
              <Presentation className="h-5 w-5 text-brand-primary" />
            </div>

            <div className="mt-5 space-y-3">
              {data.instructors.length === 0 ? (
                <p className="text-sm text-text-secondary">No instructor accounts are active yet.</p>
              ) : (
                data.instructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center justify-between gap-4 rounded-md border border-border bg-background p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{instructor.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{instructor.title ?? "Instructor"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div><p className="text-sm font-bold text-text-primary">{instructor.classes}</p><p className="text-[9px] uppercase text-text-muted">Classes</p></div>
                      <div><p className="text-sm font-bold text-text-primary">{instructor.learners}</p><p className="text-[9px] uppercase text-text-muted">Learners</p></div>
                      <div><p className="text-sm font-bold text-text-primary">{instructor.awaitingGrading}</p><p className="text-[9px] uppercase text-text-muted">To grade</p></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Credentials</h2>
                <p className="mt-1 text-xs text-text-muted">Certificate records by current credential status.</p>
              </div>
              <Award className="h-5 w-5 text-brand-primary" />
            </div>

            {data.certificates.length === 0 ? (
              <p className="mt-5 text-sm text-text-secondary">No certificates have been issued yet.</p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.certificates.map((item) => (
                  <div key={item.status} className="rounded-md border border-border bg-background p-4">
                    <p className="text-2xl font-bold text-text-primary">{item.count}</p>
                    <p className="mt-1 text-sm font-semibold text-text-secondary">{titleCase(item.status)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
          <h2 className="text-lg font-bold text-text-primary">Recent institutional activity</h2>
          <p className="mt-1 text-xs text-text-muted">Latest audited actions across the platform.</p>

          <div className="mt-5 divide-y divide-border">
            {data.recentActivity.length === 0 ? (
              <p className="py-4 text-sm text-text-secondary">No audited activity yet.</p>
            ) : (
              data.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary">
                      <span className="font-semibold">{item.actor}</span>{" "}
                      <span className="text-text-secondary">{item.action}</span>
                      {item.target && <> <span className="font-semibold">{item.target}</span></>}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {titleCase(item.entityType)} · {formatTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
