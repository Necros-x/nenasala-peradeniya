"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock, BookOpen, ChevronRight, Bell } from 'lucide-react';
import { Card, CardContent } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Progress } from '@/features/student/components/ui/Progress';
import { Skeleton } from '@/features/student/components/ui/Skeleton';
import { Badge } from '@/features/student/components/ui/Badge';
import { 
  getStudentCourses, 
  getCurrentStudent, 
  getAnnouncements, 
  getUpcomingAssignments 
} from '@/features/student/lib/services';
import { Course, Student, Announcement, Assignment } from '@/features/student/types';

export default function Dashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCurrentStudent(),
      getStudentCourses(),
      getAnnouncements(),
      getUpcomingAssignments()
    ]).then(([s, c, a, assign]) => {
      setStudent(s);
      setCourses(c);
      setAnnouncements(a);
      setAssignments(assign);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-3/4 rounded-[var(--radius-md)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
          <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
          <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  const activeCourse = courses[0]; // Just picking the first one for "Continue Learning"

  return (
    <div className="space-y-8 pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Good evening, {student?.name.split(' ')[0]}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-lg">Ready to continue learning?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning */}
          {activeCourse && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-[var(--color-primary)]" />
                Continue Learning
              </h2>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
                <div className="bg-[var(--color-brand-dark)] text-[var(--color-static-white)] rounded-[var(--radius-md)] overflow-hidden h-full flex flex-col md:flex-row relative">
                  <div className="md:w-2/5 relative">
                    <img 
                      src={activeCourse.thumbnail} 
                      alt={activeCourse.title}
                      className="w-full h-48 md:h-full object-cover opacity-80 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-static-black)]/60 to-transparent flex items-end p-4">
                      <Badge variant="secondary" className="bg-[var(--color-static-white)]/20 text-[var(--color-static-white)] border-none backdrop-blur-sm">In Progress</Badge>
                    </div>
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-center">
                    <div className="text-sm font-medium text-[var(--color-primary-muted)] mb-2">Module 1 • Lesson 4</div>
                    <h3 className="text-xl font-bold text-[var(--color-static-white)] mb-2 line-clamp-2">{activeCourse.title}</h3>
                    <p className="text-[var(--color-primary-muted)] opacity-80 mb-6 text-sm">Up next: Props and State</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Overall Progress</span>
                        <span>35%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-static-white)]/15">
                        <div className="h-full bg-[var(--color-static-white)] transition-all" style={{ width: '35%' }} />
                      </div>
                    </div>
                    
                    <Link to={`/courses/${activeCourse.id}/lesson/l_4`}>
                      <Button className="w-full sm:w-auto bg-[var(--color-static-white)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]">
                        Continue Learning <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* My Courses Overview */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Courses</h2>
              <Link to="/courses" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(course => (
                <Card key={course.id} className="group hover:border-[var(--color-primary)] transition-colors overflow-hidden">
                  <div className="p-4 flex gap-4">
                    <img src={course.thumbnail} alt={course.title} className="w-20 h-20 rounded-[var(--radius-md)] object-cover shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{course.title}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{course.instructor.name}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={course.id === 'c_1' ? 35 : 0} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{course.id === 'c_1' ? '35%' : '0%'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          
          {/* Stats */}
          <section>
            <h2 className="text-xl font-bold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-2 bg-gradient-to-br from-[var(--color-info-soft)] to-[var(--color-static-white)] border-[var(--color-info)]/20">
                <BookOpen className="ml-1 w-6 h-6 text-[var(--color-info)] mb-2" />
                <div className="ml-1 text-2xl font-bold text-[var(--color-text-primary)]">{courses.length}</div>
                <div className="ml-1 text-xs font-medium text-[var(--color-info)]/80">Enrolled Courses</div>
              </Card>
              <Card className="p-2 bg-gradient-to-br from-[var(--color-success-soft)] to-[var(--color-static-white)] border-[var(--color-success)]/20">
                <Clock className="ml-1 w-6 h-6 text-[var(--color-success)] mb-2" />
                <div className="ml-1 text-2xl font-bold text-[var(--color-success)]">12h</div>
                <div className="ml-1 text-xs font-medium text-[var(--color-success)]/80">Time Learned</div>
              </Card>
            </div>
          </section>

          {/* Upcoming Items */}
          <section>
            <h2 className="text-xl font-bold mb-4">Upcoming</h2>
            <Card>
              <div className="space-y-4 p-4">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] flex flex-col items-center justify-center border border-[var(--color-primary-muted)] shrink-0">
                      <span className="text-[10px] font-bold text-[var(--color-secondary)] uppercase">Aug</span>
                      <span className="text-sm font-bold text-[var(--color-primary)]">22</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold truncate">{assignment.title}</h5>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{assignment.courseTitle}</p>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] self-center shrink-0">
                      Due Soon
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
                    You're all caught up!
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Announcements */}
          <section>
            <h2 className="text-xl font-bold mb-4">Announcements</h2>
            <Card>
              <div className="p-4 space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-4 bg-[var(--color-primary)]/5 rounded-[var(--radius-sm)] border border-[var(--color-primary)]/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${ann.priority === 'urgent' ? 'bg-[var(--color-error)]' : 'bg-[var(--color-primary)]'}`}></span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${ann.priority === 'urgent' ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>
                        {ann.priority === 'urgent' ? 'Urgent' : 'Important'}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{ann.title}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{ann.content}</p>
                    <span className="text-[10px] text-[var(--color-text-muted)] block mt-2">{new Date(ann.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
