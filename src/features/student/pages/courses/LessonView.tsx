"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Link2,
  Menu,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/features/student/components/ui/Button";
import { Skeleton } from "@/features/student/components/ui/Skeleton";
import { getCourseById, markLessonComplete } from "@/features/student/lib/services";
import type { Course, Lesson } from "@/features/student/types";

type Props = {
  initialCourse?: Course | null;
  initialLesson?: Lesson | null;
};

export default function LessonView({ initialCourse, initialLesson }: Props) {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const realMode = initialCourse !== undefined;
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [loading, setLoading] = useState(!realMode);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (realMode) {
      setCourse(initialCourse ?? null);
      setLoading(false);
      return;
    }

    if (courseId) {
      getCourseById(courseId).then((value) => {
        setCourse(value || null);
        setLoading(false);
      });
    }
  }, [courseId, initialCourse, realMode]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }
  if (!course) return <div className="p-8">Course not found or you no longer have access.</div>;

  const allLessons: { lesson: Lesson; moduleIdx: number }[] = [];
  course.modules.forEach((module, moduleIdx) => {
    module.lessons.forEach((lesson) => allLessons.push({ lesson, moduleIdx }));
  });

  const currentIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);
  const courseLesson = currentIndex >= 0 ? allLessons[currentIndex].lesson : null;
  const currentLesson = realMode ? (initialLesson ?? courseLesson) : courseLesson;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1].lesson : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].lesson : null;

  async function handleContinue() {
    if (!currentLesson || !courseId) return;
    if (!realMode) {
      setCompleting(true);
      await markLessonComplete(courseId, currentLesson.id);
      setCompleting(false);
    }

    router.push(nextLesson
      ? `/student/courses/${courseId}/lesson/${nextLesson.id}`
      : `/student/courses/${courseId}`);
  }

  function LessonIcon({ type, completed }: { type: string; completed?: boolean }) {
    if (completed) return <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />;
    if (type === "video") return <PlayCircle className="h-4 w-4 text-[var(--color-text-muted)]" />;
    if (type === "external") return <Link2 className="h-4 w-4 text-[var(--color-text-muted)]" />;
    return <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />;
  }

  function openResource(url?: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100vh-4rem)] flex-col bg-[var(--color-background)] md:-mx-8 md:-mt-8 md:h-[calc(100vh-8rem)]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/student/courses/${courseId}`} className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="line-clamp-1 text-sm font-semibold">{course.title}</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen((value) => !value)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex w-full flex-1 flex-col overflow-y-auto">
          {currentLesson ? (
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4 md:p-8">
              <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                {currentLesson.type === "video" && currentLesson.videoUrl && (
                  <div className="relative aspect-video w-full bg-[var(--color-static-black)]">
                    <iframe
                      src={currentLesson.videoUrl}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      title={currentLesson.title}
                    />
                  </div>
                )}

                <div className="flex-1 p-6 md:p-10">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">{currentLesson.title}</h1>
                  {currentLesson.description && <p className="mt-3 text-[var(--color-text-secondary)]">{currentLesson.description}</p>}

                  {currentLesson.type === "text" && (
                    <div className="mt-8 whitespace-pre-wrap text-[var(--color-text-secondary)] leading-7">
                      {currentLesson.content || "No text has been added to this lesson yet."}
                    </div>
                  )}

                  {currentLesson.type === "video" && !currentLesson.videoUrl && (
                    <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 text-sm text-[var(--color-text-secondary)]">
                      This video link is currently unavailable.
                    </div>
                  )}

                  {currentLesson.type === "document" && (
                    <div className="mt-8 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] p-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
                      <h3 className="mb-1 text-lg font-semibold">{currentLesson.resourceName || "Document Resource"}</h3>
                      <p className="mb-5 text-sm text-[var(--color-text-muted)]">The download link is private and expires automatically.</p>
                      <Button variant="outline" disabled={!currentLesson.resourceUrl} onClick={() => openResource(currentLesson.resourceUrl)}>
                        <ExternalLink className="mr-2 h-4 w-4" /> {currentLesson.resourceUrl ? "Open Resource" : "Resource unavailable"}
                      </Button>
                    </div>
                  )}

                  {currentLesson.type === "external" && (
                    <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
                      <div className="flex items-start gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                          <Link2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--color-text-primary)]">External learning resource</h3>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">This resource opens on an external website.</p>
                          <Button className="mt-4" disabled={!currentLesson.externalUrl} onClick={() => openResource(currentLesson.externalUrl)}>
                            {currentLesson.externalLabel || "Open resource"} <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <Button
                  variant="outline"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && router.push(`/student/courses/${courseId}/lesson/${prevLesson.id}`)}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
                </Button>

                <Button className="w-full min-w-[200px] sm:w-auto" onClick={handleContinue} disabled={completing}>
                  {completing ? "Completing..." : realMode ? (nextLesson ? "Next Lesson" : "Back to Course") : <>Mark Complete {nextLesson && "& Continue"}</>}
                  {!completing && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--color-text-muted)]">Lesson not found or it is not published.</div>
          )}
        </div>

        <div className={`absolute inset-y-0 right-0 z-30 flex w-72 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ease-in-out md:relative ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
          <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/30 p-4 font-semibold">Course Content</div>
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-[var(--color-border)] last:border-0">
                <div className="bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold">Module {moduleIndex + 1}: {module.title}</div>
                <div className="divide-y divide-[var(--color-border)]/50 bg-[var(--color-background)]/50">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const active = lesson.id === lessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/student/courses/${courseId}/lesson/${lesson.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-start gap-3 border-l-2 px-4 py-3 transition-colors ${active ? "border-l-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-l-transparent hover:bg-[var(--color-surface-elevated)]"}`}
                      >
                        <div className="mt-0.5 shrink-0"><LessonIcon type={lesson.type} completed={lesson.completed} /></div>
                        <div className={`text-sm font-medium leading-tight ${active ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}>
                          {lessonIndex + 1}. {lesson.title}
                          {lesson.duration !== undefined && <div className="mt-1 text-xs font-normal text-[var(--color-text-muted)]">{lesson.duration} min</div>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
