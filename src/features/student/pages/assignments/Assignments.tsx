"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Badge } from '@/features/student/components/ui/Badge';
import { Skeleton } from '@/features/student/components/ui/Skeleton';
import { getAllAssignments } from '@/features/student/lib/services';
import { Assignment } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');

  useEffect(() => {
    getAllAssignments().then(data => {
      setAssignments(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Not Submitted':
        return <Badge variant="warning">To Do</Badge>;
      case 'Submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'Graded':
        return <Badge variant="success">Graded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Submitted':
        return <Clock className="w-5 h-5 text-[var(--color-warning)]" />;
      case 'Submitted':
        return <FileText className="w-5 h-5 text-[var(--color-info)]" />;
      case 'Graded':
        return <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />;
      default:
        return <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />;
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'todo') return a.status === 'Not Submitted';
    if (filter === 'completed') return a.status === 'Submitted' || a.status === 'Graded';
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Assignments</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage and track your coursework</p>
        </div>
        
        <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-1 shrink-0">
          {(['all', 'todo', 'completed'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-colors capitalize",
                filter === f 
                  ? "bg-[var(--color-primary)] text-[var(--color-static-white)] shadow-sm" 
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
              )}
            >
              {f === 'todo' ? 'To Do' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-[var(--color-surface-elevated)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-[var(--color-primary-soft)] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[var(--color-secondary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">You're all caught up!</h3>
                <p className="text-[var(--color-text-secondary)]">No assignments found for this filter.</p>
              </div>
            </Card>
          ) : (
            filteredAssignments.map(assignment => (
              <Link key={assignment.id} to={`/assignments/${assignment.id}`} className="block group">
                <Card className="transition-shadow group-hover:shadow-md">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                      assignment.status === 'Not Submitted' ? "bg-[var(--color-warning-soft)] border-[var(--color-warning)]/20" :
                      assignment.status === 'Submitted' ? "bg-[var(--color-info-soft)] border-[var(--color-info)]/20" :
                      "bg-[var(--color-success-soft)] border-[var(--color-success)]/20"
                    )}>
                      {getStatusIcon(assignment.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                        {assignment.courseTitle}
                      </p>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1 shrink-0">
                      {getStatusBadge(assignment.status)}
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        Due: {new Date(assignment.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="hidden sm:flex shrink-0 w-8 items-center justify-end text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
