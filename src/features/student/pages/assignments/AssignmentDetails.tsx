"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, CheckCircle2, Clock, UploadCloud, AlertCircle } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { Badge } from '@/features/student/components/ui/Badge';
import { Skeleton } from '@/features/student/components/ui/Skeleton';
import { getAssignmentById, submitAssignment } from '@/features/student/lib/services';
import { Assignment } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function AssignmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');

  useEffect(() => {
    if (id) {
      getAssignmentById(id).then(data => {
        if (data) {
          setAssignment(data);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !submissionText.trim()) return;
    setSubmitting(true);
    await submitAssignment(id, submissionText);
    const updated = await getAssignmentById(id);
    if (updated) {
      setAssignment(updated);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Card className="h-64 animate-pulse bg-[var(--color-surface-elevated)]" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Assignment Not Found</h2>
        <Button onClick={() => navigate('/assignments')}>Back to Assignments</Button>
      </div>
    );
  }

  const isLate = new Date(assignment.deadline) < new Date() && assignment.status === 'Not Submitted';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <Link to="/assignments" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Assignments
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] border-[var(--color-primary-muted)]">
                {assignment.courseTitle}
              </Badge>
              {assignment.status === 'Not Submitted' && <Badge variant={isLate ? 'error' : 'warning'}>{isLate ? 'Late' : 'To Do'}</Badge>}
              {assignment.status === 'Submitted' && <Badge variant="default">Submitted</Badge>}
              {assignment.status === 'Graded' && <Badge variant="success">Graded</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {assignment.title}
            </h1>
          </div>
          {assignment.status === 'Graded' && assignment.grade && (
            <div className="bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] px-6 py-3 rounded-[var(--radius-lg)] text-center shrink-0">
              <span className="block text-xs font-bold uppercase tracking-wider mb-1">Grade</span>
              <span className="block text-3xl font-black">{assignment.grade}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[var(--color-text-primary)]">
                <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                Instructions
              </h3>
              <div className="prose prose-sm sm:prose-base max-w-none text-[var(--color-text-secondary)]">
                <p>{assignment.description}</p>
                {/* Mock extra details */}
                <p>Please ensure your submission adheres to the required formatting guidelines. You can submit either a link to your work or paste the content directly below.</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[var(--color-text-primary)]">
                <UploadCloud className="w-5 h-5 text-[var(--color-primary)]" />
                Your Submission
              </h3>
              
              {assignment.status === 'Not Submitted' ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full min-h-[160px] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-y text-sm text-[var(--color-text-primary)]"
                    placeholder="Type your submission here, or paste a link to your work..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!submissionText.trim() || submitting}
                      className={cn(submitting && "opacity-70 cursor-not-allowed")}
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--color-background)] rounded-[var(--radius-md)] p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mb-3" />
                  <h4 className="font-bold text-[var(--color-text-primary)] mb-1">Assignment Submitted</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    You have successfully submitted this assignment.
                    {assignment.status === 'Graded' && " Your instructor has graded your work."}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">Details</h3>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Status</p>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{assignment.status}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Due Date</p>
                  <p className={cn(
                    "text-sm font-medium", 
                    isLate ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"
                  )}>
                    {new Date(assignment.deadline).toLocaleString(undefined, { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Assigned On</p>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {new Date(assignment.assignedDate).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
