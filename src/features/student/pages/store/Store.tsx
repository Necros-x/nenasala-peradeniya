"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, ShoppingBag, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Badge } from '@/features/student/components/ui/Badge';
import { getAllCourses, getEnrolledCourses } from '@/features/student/lib/services';
import { Course } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Store() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getAllCourses(),
      getEnrolledCourses()
    ]).then(([allCourses, enrolledData]) => {
      setCourses(allCourses);
      const enrolledSet = new Set(enrolledData.map(e => e.courseId));
      setEnrolledIds(enrolledSet);
      setLoading(false);
    });
  }, []);

  const handlePurchase = (courseId: string) => {
    setPurchasing(courseId);
    // Simulate payment processing delay
    setTimeout(() => {
      setPurchasing(null);
      setPurchased(courseId);
      setEnrolledIds(prev => new Set(prev).add(courseId));
      
      // Reset success state after a few seconds
      setTimeout(() => setPurchased(null), 3000);
    }, 1500); 
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Course Store</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Discover new skills and upgrade your knowledge.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isEnrolled = enrolledIds.has(course.id);
          const isPurchased = purchased === course.id;
          const isPurchasing = purchasing === course.id;
          
          return (
            <Card key={course.id} className="flex flex-col group overflow-hidden transition-shadow hover:shadow-lg">
              {/* Thumbnail Container */}
              <div className="relative h-48 w-full bg-[var(--color-surface-muted)] overflow-hidden">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--color-primary-muted)] flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[var(--color-primary-muted)]" />
                  </div>
                )}
                
                {/* Overlays */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge variant="secondary" className="bg-[var(--color-static-white)]/90 backdrop-blur-sm text-[var(--color-text-primary)] border-none shadow-sm font-semibold">
                    {course.category}
                  </Badge>
                  {course.isNew && (
                    <Badge variant="default" className="bg-[var(--color-primary)] text-[var(--color-static-white)] border-none shadow-sm flex items-center gap-1 w-fit">
                      <Sparkles className="w-3 h-3" /> New
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-[var(--color-text-primary)] mb-2 line-clamp-2 leading-tight">
                  {course.title}
                </h3>
                
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
                  {course.description}
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <img 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    className="w-8 h-8 rounded-full bg-[var(--color-border)]" 
                  />
                  <div className="text-sm">
                    <p className="font-medium text-[var(--color-text-primary)]">{course.instructor.name}</p>
                  </div>
                </div>
                
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-1">
                      Price
                    </p>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">
                      ${course.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  
                  <div className="w-32">
                    {isEnrolled ? (
                      <Button variant="outline" className="w-full text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success-soft)] hover:bg-[var(--color-success-soft)] pointer-events-none">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Owned
                      </Button>
                    ) : (
                      <Button 
                        className={cn(
                          "w-full font-semibold transition-all shadow-sm",
                          isPurchased ? "bg-[var(--color-success)] hover:bg-[var(--color-success)]/90" : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                        )}
                        onClick={() => handlePurchase(course.id)}
                        disabled={isPurchasing || isPurchased}
                      >
                        {isPurchasing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : isPurchased ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> Purchased</>
                        ) : (
                          <><ShoppingBag className="w-4 h-4 mr-2" /> Enroll</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
