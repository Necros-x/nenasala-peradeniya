"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Course } from "../../types";
import { ArrowRight, BookOpen } from "lucide-react";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link 
      to={`/courses/${course.slug}`} 
      className="group flex flex-col h-full bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-2 border border-[var(--color-border)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[calc(var(--radius-xl)-8px)] bg-[var(--color-surface-elevated)]">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-text-muted)]">
            <BookOpen className="h-8 w-8 opacity-20" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 px-4 py-5">
        <div className="flex items-center gap-2 mb-3">
           <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
             {course.category}
           </span>
        </div>
        
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 line-clamp-2 flex-1">
          {course.shortDescription || course.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
            {course.duration && <span>{course.duration}</span>}
            {course.duration && course.level && <span className="opacity-30">•</span>}
            {course.level && <span>{course.level}</span>}
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-all duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
