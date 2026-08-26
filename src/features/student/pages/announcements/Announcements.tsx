"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Badge } from '@/features/student/components/ui/Badge';
import { getAnnouncements } from '@/features/student/lib/services';
import { Announcement } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements().then(data => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Announcements</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Stay updated with the latest news and alerts</p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[var(--color-primary-soft)] rounded-full flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-[var(--color-secondary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">No announcements</h3>
              <p className="text-[var(--color-text-secondary)]">You're all caught up!</p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Link key={announcement.id} to={`/announcements/${announcement.id}`} className="block group">
              <Card className="p-5 sm:p-6 transition-shadow hover:shadow-md flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                  announcement.priority === 'urgent' ? "bg-[var(--color-error-soft)] border-[var(--color-error)]/20" :
                  announcement.priority === 'course' ? "bg-[var(--color-primary-soft)] border-[var(--color-primary-muted)]" :
                  "bg-[var(--color-surface-elevated)] border-[var(--color-border)]"
                )}>
                  <Megaphone className={cn(
                    "w-6 h-6",
                    announcement.priority === 'urgent' ? "text-[var(--color-error)]" :
                    announcement.priority === 'course' ? "text-[var(--color-primary)]" :
                    "text-[var(--color-text-muted)]"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                      {announcement.title}
                    </h3>
                    <div className="shrink-0 flex items-center gap-3">
                      {getPriorityBadge(announcement.priority)}
                      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                        {new Date(announcement.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)]">
                    <span>By {announcement.author}</span>
                  </div>
                </div>
                
                <div className="hidden sm:flex shrink-0 items-center justify-center self-stretch w-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
