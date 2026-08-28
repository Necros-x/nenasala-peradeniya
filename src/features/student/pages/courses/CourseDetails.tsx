"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronDown, FileText, Link2, Lock, PlayCircle } from "lucide-react";
import { Card } from "@/features/student/components/ui/Card";
import { Button } from "@/features/student/components/ui/Button";
import { Progress } from "@/features/student/components/ui/Progress";
import { Skeleton } from "@/features/student/components/ui/Skeleton";
import { getCourseById } from "@/features/student/lib/services";
import type { Course } from "@/features/student/types";

export default function CourseDetails({ initialCourse }: { initialCourse?: Course | null }) {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [loading, setLoading] = useState(initialCourse === undefined);

  useEffect(() => {
    if (initialCourse !== undefined) {
      setCourse(initialCourse);
      setLoading(false);
      return;
    }

    if (id) {
      getCourseById(id).then((value) => {
        setCourse(value || null);
        setLoading(false);
      });
    }
  }, [id, initialCourse]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  if (!course) return <div className="py-20 text-center">Course not found.</div>;

  const isDemoCourse = initialCourse === undefined;
  const demoProgress = course.id === "c_1" ? 35 : 0;

  function LessonIcon({ type, completed, locked }: { type: string; completed?: boolean; locked?: boolean }) {
    if (locked) return <Lock className="h-5 w-5 text-[var(--color-text-muted)]" />;
    if (completed) return <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />;
    if (type === "video") return <PlayCircle className="h-5 w-5 text-[var(--color-primary)]" />;
    if (type === "external") return <Link2 className="h-5 w-5 text-[var(--color-primary)]" />;
    return <FileText className="h-5 w-5 text-[var(--color-primary)]" />;
  }

  const firstLesson = course.modules.flatMap((module) => module.lessons)[0];

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-static-black)] text-[var(--color-static-white)] shadow-lg">
        <div className="absolute inset-0 opacity-40">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover blur-sm" />
          ) : (
            <div className="h-full w-full bg-[var(--color-primary)]/30" />
          )}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8 p-8 md:flex-row md:items-start md:p-12">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="h-32 w-48 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-static-white)]/10 object-cover shadow-2xl md:h-40 md:w-64" />
          ) : (
            <div className="grid h-32 w-48 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-static-white)]/10 bg-[var(--color-primary)]/30 font-semibold md:h-40 md:w-64">Nenasala</div>
          )}
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
            <p className="mb-4 text-lg text-[var(--color-on-brand)]/75">{course.description}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-[var(--color-on-brand)]/75 md:justify-start">
              <span className="flex items-center gap-2">
                {course.instructor.avatar ? <img src={course.instructor.avatar} alt={course.instructor.name} className="h-6 w-6 rounded-full" /> : null}
                {course.instructor.name}
              </span>
              <span>•</span>
              <span>{course.totalLessons} Lessons</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-bold">Course Content</h2>
          {course.modules.length === 0 ? (
            <Card className="p-6 text-center">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Course content is being prepared</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Your enrollment is active. Published modules and lessons will appear here as they are released.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <Card key={module.id} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 p-4 font-semibold">
                    <span>Module {moduleIndex + 1}: {module.title}</span>
                    <ChevronDown className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                  {module.lessons.length === 0 ? (
                    <div className="p-4 text-sm text-[var(--color-text-muted)]">No published lessons in this module yet.</div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isLocked = isDemoCourse && course.id !== "c_1" && lessonIndex > 0;
                        const row = (
                          <>
                            <LessonIcon type={lesson.type} completed={lesson.completed} locked={isLocked} />
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-sm font-medium ${lesson.completed ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"}`}>
                                {lessonIndex + 1}. {lesson.title}
                              </h4>
                              {lesson.description && <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-muted)]">{lesson.description}</p>}
                            </div>
                            {lesson.duration !== undefined && <span className="text-xs font-medium text-[var(--color-text-muted)]">{lesson.duration} min</span>}
                          </>
                        );

                        return isLocked ? (
                          <div key={lesson.id} className="flex cursor-not-allowed items-center gap-4 p-4 opacity-60">{row}</div>
                        ) : (
                          <Link key={lesson.id} href={`/student/courses/${course.id}/lesson/${lesson.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--color-surface-elevated)]">
                            {row}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6 p-6">
            {isDemoCourse ? (
              <>
                <h3 className="mb-4 text-lg font-bold">Your Progress</h3>
                <div className="mb-2 flex items-end gap-2 text-3xl font-semibold text-[var(--color-text-primary)]">
                  {demoProgress}% <span className="relative top-[-4px] mb-1 text-sm font-medium text-[var(--color-text-muted)]">Completed</span>
                </div>
                <Progress value={demoProgress} className="mb-6 h-2" />
              </>
            ) : (
              <>
                <h3 className="mb-2 text-lg font-bold">Start learning</h3>
                <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">Open a published lesson below. Lesson progress will be connected in the progress phase.</p>
              </>
            )}

            {firstLesson ? (
              <Link href={`/student/courses/${course.id}/lesson/${firstLesson.id}`}>
                <Button className="h-12 w-full text-lg">{isDemoCourse && demoProgress > 0 ? "Resume Course" : "Start Course"}</Button>
              </Link>
            ) : (
              <Button className="h-12 w-full text-lg" disabled>Content coming soon</Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
