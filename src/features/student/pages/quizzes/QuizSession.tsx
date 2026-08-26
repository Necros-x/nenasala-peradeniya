"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Button } from '@/features/student/components/ui/Button';
import { getQuizById, submitQuiz } from '@/features/student/lib/services';
import { Quiz, Question } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function QuizSession() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (quizId) {
      getQuizById(quizId).then(data => {
        if (data && data.questions) {
          setQuiz(data);
        } else {
          // Fallback or error if no questions
          navigate('/quizzes');
        }
        setLoading(false);
      });
    }
  }, [quizId, navigate]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (!quiz || !quiz.questions) return null;

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = answers[currentQuestion.id] !== undefined;

  const handleAnswer = (answer: string | boolean) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });
    
    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= 60;
    
    await submitQuiz(quiz.id, percentage);
    setResult({ score: percentage, passed });
    setSubmitting(false);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="text-center p-12">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            result.passed ? "bg-[var(--color-success-soft)]" : "bg-[var(--color-error-soft)]"
          )}>
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-[var(--color-success)]" />
            ) : (
              <AlertCircle className="w-10 h-10 text-[var(--color-error)]" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            {result.passed ? "Congratulations! You Passed" : "Quiz Failed"}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            You scored <span className="font-bold text-[var(--color-text-primary)]">{result.score}%</span> on the {quiz.title}.
          </p>
          <Button onClick={() => navigate('/quizzes')} className="w-full sm:w-auto">
            Return to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{quiz.title}</h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{quiz.courseTitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-4 py-2 rounded-full border border-[var(--color-primary-muted)] shrink-0">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
        <div 
          className="bg-[var(--color-primary)] h-full transition-all duration-300 ease-in-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-8 leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className={cn(
                "w-full text-left p-4 rounded-[var(--radius-md)] border-2 transition-all",
                answers[currentQuestion.id] === option
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/50"
                  : "border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-background)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  answers[currentQuestion.id] === option
                    ? "border-[var(--color-primary)]"
                    : "border-[var(--color-border-strong)]"
                )}>
                  {answers[currentQuestion.id] === option && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  answers[currentQuestion.id] === option ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"
                )}>
                  {option}
                </span>
              </div>
            </button>
          ))}

          {currentQuestion.type === 'true_false' && ['True', 'False'].map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={cn(
                "w-full text-left p-4 rounded-[var(--radius-md)] border-2 transition-all",
                answers[currentQuestion.id] === option
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/50"
                  : "border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-background)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  answers[currentQuestion.id] === option
                    ? "border-[var(--color-primary)]"
                    : "border-[var(--color-border-strong)]"
                )}>
                  {answers[currentQuestion.id] === option && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  answers[currentQuestion.id] === option ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"
                )}>
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={currentIndex === 0 || submitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!isAnswered || submitting}
          className={isLastQuestion ? "bg-[var(--color-success)] hover:bg-[var(--color-success)]/90" : ""}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting</>
          ) : isLastQuestion ? (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Quiz</>
          ) : (
            <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
