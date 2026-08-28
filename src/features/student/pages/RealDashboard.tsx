import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Film,
  PlayCircle,
  Radio,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import { Progress } from "@/features/student/components/ui/Progress";
import type { Course } from "@/features/student/types";
import type { StudentDashboardData } from "@/lib/services/student-dashboard";

function courseStatus(course: Course) {
  const progress = course.progressPercent ?? 0;
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

function continueContext(course: Course | undefined) {
  if (!course) return null;
  const targetId = course.continueLessonId;
  if (!targetId) return null;

  for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex += 1) {
    const module = course.modules[moduleIndex];
    const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === targetId);
    if (lessonIndex >= 0) {
      return {
        moduleIndex,
        lessonIndex,
        moduleTitle: module.title,
        lesson: module.lessons[lessonIndex],
      };
    }
  }
  return null;
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function upcomingEventIcon(event: StudentDashboardData["upcomingEvents"][number]) {
  if (event.status === "live") return <Radio className="h-5 w-5" />;
  if (event.type !== "deadline") return <CalendarDays className="h-5 w-5" />;
  if (event.assignmentState === "overdue") return <AlertTriangle className="h-5 w-5" />;
  if (event.assignmentState === "resubmission") return <RotateCcw className="h-5 w-5" />;
  return <ClipboardList className="h-5 w-5" />;
}

function upcomingEventBadge(event: StudentDashboardData["upcomingEvents"][number]) {
  if (event.status === "live") return <Badge variant="error">Live</Badge>;
  if (event.type !== "deadline") return null;
  if (event.assignmentState === "overdue") return <Badge variant="error">Overdue</Badge>;
  if (event.assignmentState === "due_soon") return <Badge variant="warning">Due soon</Badge>;
  if (event.assignmentState === "resubmission") return <Badge variant="default">Resubmission open</Badge>;
  return <Badge variant="warning">Assignment due</Badge>;
}

export default function RealDashboard({ data }: { data: StudentDashboardData }) {
  const activeCourse =
    data.courses.find((course) => (course.progressPercent ?? 0) > 0 && (course.progressPercent ?? 0) < 100) ??
    data.courses.find((course) => (course.progressPercent ?? 0) < 100) ??
    data.courses[0];

  const next = continueContext(activeCourse);
  const activeProgress = activeCourse?.progressPercent ?? 0;
  const firstName = data.studentName.split(" ").filter(Boolean)[0] || "Student";

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Welcome back, {firstName}</h1>
        <p className="mt-1 text-lg text-[var(--color-text-secondary)]">Continue from where you left off.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
              <PlayCircle className="h-5 w-5 text-[var(--color-primary)]" /> Continue Learning
            </h2>

            {activeCourse ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
                <div className="relative flex min-h-64 flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-dark)] text-[var(--color-static-white)] md:flex-row">
                  <div className="relative min-h-48 md:w-2/5">
                    {activeCourse.thumbnail ? (
                      <img src={activeCourse.thumbnail} alt={activeCourse.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--color-primary)]/25" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-static-black)]/70 to-transparent" />
                    <Badge variant={activeProgress >= 100 ? "success" : "secondary"} className="absolute bottom-4 left-4">
                      {courseStatus(activeCourse)}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                    {next ? (
                      <p className="mb-2 text-sm font-semibold text-[var(--color-primary-muted)]">
                        Module {next.moduleIndex + 1} • Lesson {next.lessonIndex + 1}
                      </p>
                    ) : (
                      <p className="mb-2 text-sm font-semibold text-[var(--color-primary-muted)]">Course overview</p>
                    )}

                    <h3 className="text-2xl font-bold text-[var(--color-static-white)]">{activeCourse.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-static-white)]/70">
                      {next ? `Up next: ${next.lesson.title}` : activeCourse.totalLessons > 0 ? "All published lessons are complete." : "Published content will appear here when available."}
                    </p>

                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Overall Progress</span>
                        <span>{activeProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-static-white)]/15">
                        <div className="h-full bg-[var(--color-static-white)] transition-all" style={{ width: `${activeProgress}%` }} />
                      </div>
                      <p className="text-xs text-[var(--color-static-white)]/60">
                        {activeCourse.completedLessons ?? 0} of {activeCourse.totalLessons} lessons complete
                      </p>
                    </div>

                    <div className="mt-6">
                      <Link href={next ? `/student/courses/${activeCourse.id}/lesson/${next.lesson.id}` : `/student/courses/${activeCourse.id}`}>
                        <Button className="bg-[var(--color-static-white)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]">
                          {activeProgress > 0 && activeProgress < 100 ? "Continue Learning" : activeProgress >= 100 ? "Review Course" : "Start Course"}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--color-primary)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">No assigned courses yet</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your dashboard will populate when your intake receives a class.</p>
              </Card>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">My Courses</h2>
              <Link href="/student/courses" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">View all</Link>
            </div>

            {data.courses.length === 0 ? (
              <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)]">No courses assigned yet.</Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.courses.slice(0, 4).map((course) => {
                  const progress = course.progressPercent ?? 0;
                  return (
                    <Link key={course.id} href={`/student/courses/${course.id}`}>
                      <Card className="h-full overflow-hidden transition-colors hover:border-[var(--color-primary)]">
                        <div className="flex gap-4 p-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)]">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-xs font-semibold text-[var(--color-text-muted)]">Nenasala</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-[var(--color-text-primary)]">{course.title}</h3>
                            <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{course.instructor.name}</p>
                            <div className="mt-4 flex items-center gap-2">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">Your Stats</h2>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <Card className="p-4">
                <BookOpen className="mb-2 h-5 w-5 text-[var(--color-info)]" />
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{data.courses.length}</p>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">Enrolled Courses</p>
              </Card>
              <Card className="p-4">
                <CheckCircle2 className="mb-2 h-5 w-5 text-[var(--color-success)]" />
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{data.completedLessons}/{data.totalLessons}</p>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">Lessons Completed</p>
              </Card>
              <Card className="p-4">
                <Film className="mb-2 h-5 w-5 text-[var(--color-primary)]" />
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{data.completedRecordings}</p>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">Recordings Watched</p>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">Upcoming</h2>
            <Card>
              {data.upcomingEvents.length === 0 ? (
                <div className="p-6 text-center">
                  <CalendarDays className="mx-auto mb-3 h-7 w-7 text-[var(--color-text-muted)]" />
                  <p className="font-semibold text-[var(--color-text-primary)]">Nothing scheduled</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Live sessions and assignment deadlines will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {data.upcomingEvents.map((event) => (
                    <div key={event.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] ${
                          event.assignmentState === "overdue"
                            ? "bg-[var(--color-error-soft)] text-[var(--color-error)]"
                            : event.assignmentState === "due_soon"
                              ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                              : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        }`}>
                          {upcomingEventIcon(event)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
                            {upcomingEventBadge(event)}
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{event.courseTitle}</p>
                          <p className="mt-2 text-xs font-medium text-[var(--color-text-secondary)]">{formatEventDate(event.date)} • {event.time ?? "Time TBA"}</p>
                          {event.link && event.type === "live_session" && (
                            <a href={event.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[var(--color-primary)] hover:underline">
                              Join session
                            </a>
                          )}
                          {event.link && event.type === "deadline" && (
                            <Link href={event.link} className="mt-3 inline-flex text-xs font-bold text-[var(--color-primary)] hover:underline">
                              Open assignment
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">Announcements</h2>
            <Card className="p-6 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">No announcements yet. Important course updates will appear here.</p>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
