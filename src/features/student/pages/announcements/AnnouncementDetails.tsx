"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Megaphone, AlertCircle, Calendar, User, ArrowLeft } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Badge } from '@/features/student/components/ui/Badge';
import { Button } from '@/features/student/components/ui/Button';
import { getAnnouncementById } from '@/features/student/lib/services';
import { Announcement } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function AnnouncementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getAnnouncementById(id).then(data => {
        if (data) {
          setAnnouncement(data);
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="max-w-3xl mx-auto pt-8">
        <Card className="text-center p-12">
          <Megaphone className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Announcement Not Found</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">The announcement you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/announcements')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Announcements
          </Button>
        </Card>
      </div>
    );
  }

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error" className="gap-1"><AlertCircle className="w-3 h-3" /> Urgent</Badge>;
      case 'course':
        return <Badge variant="secondary">Course Update</Badge>;
      default:
        return <Badge variant="default">General</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/announcements')}
        className="mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Announcements
      </Button>
      
      <Card className="overflow-hidden">
        {/* Header Section */}
        <div className={cn(
          "p-6 sm:p-8 border-b border-[var(--color-border)]",
          announcement.priority === 'urgent' ? "bg-[var(--color-error-soft)]/50" :
          announcement.priority === 'course' ? "bg-[var(--color-primary-soft)]/50" :
          "bg-[var(--color-surface)]"
        )}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {getPriorityBadge(announcement.priority)}
            {announcement.courseId && (
              <Badge variant="outline" className="bg-[var(--color-static-white)]">Course: {announcement.courseId}</Badge>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">
            {announcement.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span>{announcement.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span>{formatDate(announcement.date)}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8">
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--color-text-primary)] leading-relaxed">
            {/* Split by newlines to render simple paragraphs since it's plain text mock data */}
            {announcement.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
