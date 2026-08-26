"use client";

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlayCircle, CheckCircle2, Lock, FileText, ChevronDown } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Progress } from '@/features/student/components/ui/Progress';
import { Skeleton } from '@/features/student/components/ui/Skeleton';
import { getCourseById } from '@/features/student/lib/services';
import { Course, Lesson } from '@/features/student/types';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getCourseById(id).then(c => {
        setCourse(c || null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-20">Course not found.</div>;
  }

  const progress = course.id === 'c_1' ? 35 : 0;

  const LessonIcon = ({ type, completed, locked }: { type: string, completed?: boolean, locked?: boolean }) => {
    if (locked) return <Lock className="w-5 h-5 text-[var(--color-text-muted)]" />;
    if (completed) return <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />;
    if (type === 'video') return <PlayCircle className="w-5 h-5 text-[var(--color-primary)]" />;
    return <FileText className="w-5 h-5 text-[var(--color-primary)]" />;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-static-black)] text-[var(--color-static-white)] shadow-lg">
        <div className="absolute inset-0 opacity-40">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover blur-sm" />
        </div>
        <div className="relative p-8 md:p-12 z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <img src={course.thumbnail} alt={course.title} className="w-48 h-32 md:w-64 md:h-40 rounded-[var(--radius-md)] object-cover shadow-2xl border border-[var(--color-static-white)]/10 shrink-0" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{course.title}</h1>
            <p className="text-[var(--color-on-brand)]/75 text-lg mb-4">{course.description}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-[var(--color-on-brand)]/75">
              <span className="flex items-center gap-2">
                <img src={course.instructor.avatar} alt={course.instructor.name} className="w-6 h-6 rounded-full" />
                {course.instructor.name}
              </span>
              <span>•</span>
              <span>{course.totalLessons} Lessons</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Curriculum */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold">Course Content</h2>
          <div className="space-y-4">
            {course.modules.map((mod, mIdx) => (
              <Card key={mod.id} className="overflow-hidden">
                <div className="p-4 bg-[var(--color-surface-elevated)]/50 border-b border-[var(--color-border)] flex items-center justify-between font-semibold">
                  <span>Module {mIdx + 1}: {mod.title}</span>
                  <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {mod.lessons.map((lesson, lIdx) => {
                    const isLocked = course.id !== 'c_1' && lIdx > 0;
                    return (
                      <Link 
                        key={lesson.id} 
                        to={isLocked ? '#' : `/courses/${course.id}/lesson/${lesson.id}`}
                        className={`p-4 flex items-center gap-4 hover:bg-[var(--color-surface-elevated)] transition-colors ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <LessonIcon type={lesson.type} completed={lesson.completed} locked={isLocked} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${lesson.completed ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                            {lIdx + 1}. {lesson.title}
                          </h4>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-[var(--color-text-muted)] font-medium">
                            {lesson.duration} min
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Your Progress</h3>
            <div className="flex items-end gap-2 mb-2 text-[var(--color-text-primary)] font-semibold text-3xl">
              {progress}% <span className="text-sm text-[var(--color-text-muted)] font-medium mb-1 relative top-[-4px]">Completed</span>
            </div>
            <Progress value={progress} className="h-2 mb-6" />
            <Link to={`/courses/${course.id}/lesson/${course.modules[0].lessons[0].id}`}>
              <Button className="w-full text-lg h-12">
                {progress > 0 ? 'Resume Course' : 'Start Course'}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
