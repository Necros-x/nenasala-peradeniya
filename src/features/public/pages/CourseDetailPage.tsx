"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseBySlug, getInstructorById, getIntakesByCourseId } from "../lib/mock-data";
import { Course, Instructor, Intake } from "../types";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import { ArrowLeft, Clock, BookOpen, Calendar, User, CheckCircle2, ChevronRight } from "lucide-react";

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      getCourseBySlug(slug).then(c => {
        setCourse(c || null);
        if (c?.instructorId) {
          getInstructorById(c.instructorId).then(i => setInstructor(i || null));
        }
        if (c?.id) {
          getIntakesByCourseId(c.id).then(setIntakes);
        }
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        <p className="mt-4 text-[var(--color-text-secondary)]">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">The course you are looking for does not exist or has been removed.</p>
        <Link to="/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] relative">
        {course.thumbnail && (
           <div className="absolute inset-0 opacity-10">
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
           </div>
        )}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="max-w-3xl">
            <Link to="/courses" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
            <div className="flex gap-2 mb-4">
               <Badge variant="secondary">{course.category}</Badge>
               {course.level && <Badge variant="outline">{course.level}</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl md:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 text-xl text-[var(--color-text-secondary)]">
              {course.shortDescription}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-secondary)]">
              {course.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="font-medium">{course.duration}</span>
                </div>
              )}
              {course.level && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="font-medium">{course.level}</span>
                </div>
              )}
              {instructor && (
                 <div className="flex items-center gap-2">
                   <User className="h-5 w-5 text-[var(--color-primary)]" />
                   <span className="font-medium">Led by {instructor.name}</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* About Course */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">About This Course</h2>
              <div className="prose prose-slate max-w-none text-[var(--color-text-secondary)]">
                <p className="whitespace-pre-line leading-relaxed">{course.description}</p>
              </div>
            </section>

            {/* Curriculum Preview */}
            {course.modules && course.modules.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Course Curriculum</h2>
                <div className="space-y-4">
                  {course.modules.map((module, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                          {idx + 1}
                        </div>
                        <h4 className="font-medium text-[var(--color-text-primary)]">{module.title}</h4>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">{module.lessons} lessons</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructor */}
            {instructor && (
               <section className="pt-8 border-t border-[var(--color-border)]">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Your Instructor</h2>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                     {instructor.image ? (
                        <img src={instructor.image} alt={instructor.name} className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-surface-elevated)]" />
                     ) : (
                        <div className="w-24 h-24 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                           <User className="h-10 w-10 text-[var(--color-text-muted)]" />
                        </div>
                     )}
                     <div>
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{instructor.name}</h3>
                        <p className="text-[var(--color-primary)] font-medium mb-3">{instructor.role}</p>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">{instructor.bio}</p>
                        <div className="flex gap-2 flex-wrap">
                           {instructor.expertise?.map(exp => (
                              <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                           ))}
                        </div>
                     </div>
                  </div>
               </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 mt-12 lg:mt-0">
            <div className="sticky top-24 space-y-6">
              <Card className="border-[var(--color-primary)]/20 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Enrollment Information</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                       <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5 mr-3 flex-shrink-0" />
                       <div>
                          <p className="font-medium text-[var(--color-text-primary)]">100% Online</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">Learn from anywhere</p>
                       </div>
                    </div>
                    <div className="flex items-start">
                       <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5 mr-3 flex-shrink-0" />
                       <div>
                          <p className="font-medium text-[var(--color-text-primary)]">Verifiable Certificate</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">Upon completion</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full" size="lg">Apply Now</Button>
                    <p className="text-xs text-center text-[var(--color-text-secondary)]">
                      Applying is free. No commitment required.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {intakes.length > 0 && (
                 <Card>
                    <CardContent className="p-6">
                       <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
                          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Upcoming Intakes</h3>
                       </div>
                       <div className="space-y-4">
                          {intakes.map(intake => (
                             <div key={intake.id} className="pb-4 last:pb-0 border-b last:border-0 border-[var(--color-border)]">
                                <p className="font-medium text-[var(--color-text-primary)] mb-1">{intake.title}</p>
                                <div className="flex items-center justify-between">
                                   <p className="text-sm text-[var(--color-text-secondary)]">Starts: {new Date(intake.startDate).toLocaleDateString()}</p>
                                   <Badge variant={
                                      intake.status === 'open' ? 'success' :
                                      intake.status === 'closing-soon' ? 'warning' : 'secondary'
                                   } className="text-[10px]">
                                      {intake.status.replace('-', ' ').toUpperCase()}
                                   </Badge>
                                </div>
                             </div>
                          ))}
                       </div>
                       <Button variant="outline" className="w-full mt-4">View All Dates</Button>
                    </CardContent>
                 </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
