"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Clock, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Badge } from '@/features/student/components/ui/Badge';
import { Button } from '@/features/student/components/ui/Button';
import { getAllQuizzes } from '@/features/student/lib/services';
import { Quiz } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllQuizzes().then(data => {
      setQuizzes(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: Quiz['status']) => {
    switch (status) {
      case 'Passed':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Passed</Badge>;
      case 'Failed':
        return <Badge variant="error" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="default">Not Attempted</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Quizzes</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Test your knowledge and track your progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map(quiz => (
          <Card key={quiz.id} className="flex flex-col group transition-shadow hover:shadow-md">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0 border border-[var(--color-primary-muted)]">
                  <FileQuestion className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                {getStatusBadge(quiz.status)}
              </div>
              
              <h3 className="font-bold text-xl text-[var(--color-text-primary)] mb-2 line-clamp-2">
                {quiz.title}
              </h3>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-6">
                {quiz.courseTitle}
              </p>
              
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-elevated)] p-3 rounded-[var(--radius-md)] flex items-center gap-3">
                  <FileQuestion className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Questions</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{quiz.numberOfQuestions}</p>
                  </div>
                </div>
                <div className="bg-[var(--color-surface-elevated)] p-3 rounded-[var(--radius-md)] flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Time</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{quiz.timeLimit} mins</p>
                  </div>
                </div>
              </div>

              {quiz.score !== undefined && (
                <div className="mt-4 flex items-center justify-between text-sm p-3 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)]/50 border border-[var(--color-primary-muted)]">
                  <span className="font-medium text-[var(--color-text-primary)]">Your Score</span>
                  <span className={cn(
                    "font-bold",
                    quiz.score >= 60 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  )}>
                    {quiz.score}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 rounded-b-[var(--radius-lg)]">
              <Link to={`/quizzes/${quiz.id}`} className="block">
                <Button className="w-full justify-between group-hover:bg-[var(--color-primary-hover)]">
                  {quiz.status === 'Not Attempted' ? 'Start Quiz' : 'Retake Quiz'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full p-12 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
            <FileQuestion className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">No quizzes available</h3>
            <p className="text-[var(--color-text-secondary)]">Check back later for new assessments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
