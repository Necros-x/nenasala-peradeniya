import { BookOpen, Clock, FileText, Video } from "lucide-react";
import type { InstructorContentCourse } from "@/lib/services/instructor-portal";

function icon(type: string) {
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "text") return <FileText className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

export default function InstructorContent({ courses }: { courses: InstructorContentCourse[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Course Content</h1>
        <p className="mt-1 text-text-secondary">Published learning content for courses you teach. Content editing remains admin-controlled.</p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-text-secondary">No published content is available yet.</div>
      ) : (
        courses.map((course) => (
          <section key={course.course_id} className="space-y-3">
            <h2 className="text-xl font-bold text-text-primary">{course.course_title}</h2>
            {course.modules.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-secondary">No published modules.</div>
            ) : (
              <div className="space-y-3">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
                    <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">Module {moduleIndex + 1}</p>
                      <h3 className="mt-1 text-lg font-bold text-text-primary">{module.title}</h3>
                      {module.description && <p className="mt-1 text-sm text-text-secondary">{module.description}</p>}
                      <div className="mt-4 space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--color-primary-soft)] text-brand-primary">{icon(lesson.lesson_type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-text-primary">{lessonIndex + 1}. {lesson.title}</p>
                              <p className="mt-0.5 text-xs capitalize text-text-muted">{lesson.lesson_type.replace("_", " ")}</p>
                            </div>
                            {lesson.duration_minutes != null && (
                              <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3.5 w-3.5" />{lesson.duration_minutes}m</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
