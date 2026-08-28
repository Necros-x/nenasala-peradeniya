"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Input } from '@/features/student/components/ui/Input';
import { Progress } from '@/features/student/components/ui/Progress';
import { Badge } from '@/features/student/components/ui/Badge';
import { getStudentCourses } from '@/features/student/lib/services';
import { Course } from '@/features/student/types';

export default function MyCourses({ initialCourses }: { initialCourses?: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? []);
  const [loading, setLoading] = useState(initialCourses === undefined);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (initialCourses !== undefined) {
      setCourses(initialCourses);
      setLoading(false);
      return;
    }

    getStudentCourses().then(c => {
      setCourses(c);
      setLoading(false);
    });
  }, [initialCourses]);

  const visibleCourses = courses.filter((course) => {
    const progress = initialCourses === undefined && course.id === 'c_1' ? 35 : (course.progressPercent ?? 0);
    const matchesFilter =
      filter === 'All' ||
      (filter === 'In Progress' && progress > 0 && progress < 100) ||
      (filter === 'Not Started' && progress === 0) ||
      (filter === 'Completed' && progress === 100);
    const matchesQuery = course.title.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">My Courses</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Continue where you left off</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Find a course..." className="pl-9 rounded-full bg-[var(--color-background)] border-[var(--color-border)]" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto no-scrollbar">
        {['All', 'In Progress', 'Not Started', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-[var(--color-primary)] text-[var(--color-static-white)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-80 animate-pulse bg-[var(--color-surface-elevated)]" />
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">No courses assigned yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Your courses will appear here when your intake has active or scheduled classes.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map(course => {
            const isDemoCourse = initialCourses === undefined;
            const progress = isDemoCourse && course.id === 'c_1' ? 35 : (course.progressPercent ?? 0);
            const completedLessons = isDemoCourse && course.id === 'c_1' ? 3 : (course.completedLessons ?? 0);
            return (
              <Card key={course.id} className="overflow-hidden flex flex-col hover:border-[var(--color-primary)] transition-colors group">
                <div className="relative h-48 shrink-0 overflow-hidden bg-[var(--color-surface-elevated)]">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-semibold text-[var(--color-text-muted)]">Nenasala</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-[var(--color-static-white)]/90 text-[var(--color-static-black)] backdrop-blur-sm border-none shadow-sm">
                      {course.category}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{course.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">{course.instructor.name}</p>

                  <div className="mt-auto space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
                        <span>{progress}% Complete</span>
                        <span>{completedLessons}/{course.totalLessons}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <Link to={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-static-white)] group-hover:border-transparent">
                        {progress > 0 ? 'Continue Course' : 'Start Course'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
