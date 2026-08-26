"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  PlayCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/features/student/components/ui/Button";
import { Skeleton } from "@/features/student/components/ui/Skeleton";
import {
  getCourseById,
  markLessonComplete,
} from "@/features/student/lib/services";
import { Course, Lesson } from "@/features/student/types";

export default function LessonView() {
  const { id: courseId, lessonId } = useParams<{
    id: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId).then((c) => {
        setCourse(c || null);
        setLoading(false);
      });
    }
  }, [courseId]);

  if (loading)
    return (
      <div className="p-8">
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  if (!course) return <div className="p-8">Course not found.</div>;

  // Flatten lessons for easy prev/next navigation
  const allLessons: { lesson: Lesson; moduleIdx: number }[] = [];
  course.modules.forEach((m, idx) => {
    m.lessons.forEach((l) => allLessons.push({ lesson: l, moduleIdx: idx }));
  });

  const currentIndex = allLessons.findIndex((l) => l.lesson.id === lessonId);
  const currentLessonData = currentIndex >= 0 ? allLessons[currentIndex] : null;
  const currentLesson = currentLessonData?.lesson;

  const prevLesson =
    currentIndex > 0 ? allLessons[currentIndex - 1].lesson : null;
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1].lesson
      : null;

  const handleComplete = async () => {
    if (!currentLesson || !courseId) return;
    setCompleting(true);
    await markLessonComplete(courseId, currentLesson.id);
    setCompleting(false);
    if (nextLesson) {
      navigate(`/courses/${courseId}/lesson/${nextLesson.id}`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  const LessonIcon = ({
    type,
    completed,
  }: {
    type: string;
    completed?: boolean;
  }) => {
    if (completed)
      return <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />;
    if (type === "video")
      return <PlayCircle className="w-4 h-4 text-[var(--color-text-muted)]" />;
    return <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] -mx-4 -mt-4 md:-mx-8 md:-mt-8 bg-[var(--color-background)]">
      {/* Top Header */}
      <div className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/courses/${courseId}`}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-sm line-clamp-1">
            {course.title}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto w-full">
          {currentLesson ? (
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col p-4 md:p-8">
              {/* Content Wrapper */}
              <div className="flex-1 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-sm border border-[var(--color-border)] overflow-hidden flex flex-col">
                {/* Video Player Area */}
                {currentLesson.type === "video" && currentLesson.videoUrl && (
                  <div className="w-full aspect-video bg-[var(--color-static-black)] relative">
                    <iframe
                      src={currentLesson.videoUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      title={currentLesson.title}
                    />
                  </div>
                )}

                {/* Content Area */}
                <div className="p-6 md:p-10 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-6 text-[var(--color-text-primary)]">
                    {currentLesson.title}
                  </h1>

                  {currentLesson.type === "text" && currentLesson.content && (
                    <div className="prose prose-blue max-w-none text-[var(--color-text-secondary)]">
                      {currentLesson.content}
                    </div>
                  )}
                  {currentLesson.type === "document" && (
                    <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] text-center">
                      <FileText className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">
                        Document Resource
                      </h3>
                      <Button variant="outline">Download PDF</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="outline"
                  disabled={!prevLesson}
                  onClick={() =>
                    prevLesson &&
                    navigate(`/courses/${courseId}/lesson/${prevLesson.id}`)
                  }
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous Lesson
                </Button>

                <Button
                  className="w-full sm:w-auto min-w-[200px]"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  {completing ? (
                    "Completing..."
                  ) : (
                    <>
                      Mark Complete {nextLesson && "& Continue"}{" "}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
              Lesson not found.
            </div>
          )}
        </div>

        {/* Sidebar (Desktop always visible, Mobile toggleable) */}
        <div
          className={`
          absolute md:relative inset-y-0 right-0 z-30 w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)]
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
        >
          <div className="p-4 border-b border-[var(--color-border)] font-semibold shrink-0 bg-[var(--color-surface-elevated)]/30">
            Course Content
          </div>
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((mod, mIdx) => (
              <div
                key={mod.id}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <div className="px-4 py-3 bg-[var(--color-surface)] font-semibold text-sm">
                  Module {mIdx + 1}: {mod.title}
                </div>
                <div className="divide-y divide-[var(--color-border)]/50 bg-[var(--color-background)]/50">
                  {mod.lessons.map((lesson, lIdx) => {
                    const isActive = lesson.id === lessonId;
                    return (
                      <Link
                        key={lesson.id}
                        to={`/courses/${courseId}/lesson/${lesson.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors ${isActive ? "bg-[var(--color-primary)]/10 border-l-2 border-l-[var(--color-primary)]" : "hover:bg-[var(--color-surface-elevated)] border-l-2 border-l-transparent"}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <LessonIcon
                            type={lesson.type}
                            completed={lesson.completed}
                          />
                        </div>
                        <div
                          className={`text-sm font-medium leading-tight ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}
                        >
                          {lIdx + 1}. {lesson.title}
                          {lesson.duration && (
                            <div className="text-xs text-[var(--color-text-muted)] mt-1 font-normal">
                              {lesson.duration} min
                            </div>
                          )}
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
