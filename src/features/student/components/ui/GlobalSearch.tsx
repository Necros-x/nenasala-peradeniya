"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X, BookOpen, PlayCircle, FileText, ClipboardList } from 'lucide-react';
import { Input } from './Input';
import { searchGlobal } from '@/features/student/lib/services';
import { cn } from '@/features/student/lib/utils';
import { Course, Assignment } from '@/features/student/types';

interface SearchResults {
  courses: Course[];
  lessons: { courseId: string; courseTitle: string; lesson: any }[];
  assignments: Assignment[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResults>({ courses: [], lessons: [], assignments: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], lessons: [], assignments: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchGlobal(query);
      setResults(data);
      setIsSearching(false);
      setIsOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results.courses.length > 0 || results.lessons.length > 0 || results.assignments.length > 0;

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md hidden md:block" ref={containerRef}>
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        )}
        <Input 
          placeholder="Search courses, lessons, assignments..." 
          className="pl-9 pr-9 rounded-full bg-[var(--color-background)] border-[var(--color-border)] focus:bg-[var(--color-surface)]"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50 max-h-[28rem] flex flex-col">
          {!isSearching && !hasResults ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
              No results found for "{query}"
            </div>
          ) : (
            <div className="overflow-y-auto p-2">
              {results.courses.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-2 mt-2">Courses</h4>
                  <div className="space-y-1">
                    {results.courses.map(course => (
                      <button
                        key={course.id}
                        onClick={() => handleResultClick(`/courses/${course.id}`)}
                        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[var(--color-surface-elevated)] rounded-[var(--radius-sm)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{course.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] truncate">{course.instructor}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.lessons.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-2 mt-2">Lessons</h4>
                  <div className="space-y-1">
                    {results.lessons.map(({ courseId, courseTitle, lesson }) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleResultClick(`/courses/${courseId}/lesson/${lesson.id}`)}
                        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[var(--color-surface-elevated)] rounded-[var(--radius-sm)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-[var(--color-success-soft)] flex items-center justify-center shrink-0">
                          {lesson.type === 'video' ? (
                            <PlayCircle className="w-4 h-4 text-[var(--color-success)]" />
                          ) : (
                            <FileText className="w-4 h-4 text-[var(--color-success)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{lesson.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] truncate">{courseTitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.assignments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-2 mt-2">Assignments</h4>
                  <div className="space-y-1">
                    {results.assignments.map(assignment => (
                      <button
                        key={assignment.id}
                        onClick={() => handleResultClick(`/assignments/${assignment.id}`)}
                        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[var(--color-surface-elevated)] rounded-[var(--radius-sm)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{assignment.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] truncate">{assignment.courseTitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
