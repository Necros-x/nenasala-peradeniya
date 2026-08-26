"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Video, Clock, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/features/student/components/ui/Card';
import { Badge } from '@/features/student/components/ui/Badge';
import { getEvents } from '@/features/student/lib/services';
import { CalendarEvent } from '@/features/student/types';
import { cn } from '@/features/student/lib/utils';

export default function Schedule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'live_session':
        return <Video className="w-5 h-5 text-[var(--color-primary)]" />;
      case 'deadline':
        return <Clock className="w-5 h-5 text-[var(--color-warning)]" />;
      case 'assignment':
        return <ClipboardList className="w-5 h-5 text-[var(--color-success)]" />;
    }
  };

  const getEventBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'live_session':
        return <Badge variant="default">Live Session</Badge>;
      case 'deadline':
        return <Badge variant="warning">Deadline</Badge>;
      case 'assignment':
        return <Badge variant="success">Assignment</Badge>;
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      day: date.getDate(),
      weekday: date.toLocaleString('default', { weekday: 'long' })
    };
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Event Schedule</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Upcoming deadlines, live sessions, and due dates</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[var(--color-primary-soft)] rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-[var(--color-secondary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Your schedule is clear!</h3>
              <p className="text-[var(--color-text-secondary)]">No upcoming events or deadlines at the moment.</p>
            </div>
          </Card>
        ) : (
          events.map((event) => {
            const dateParts = formatEventDate(event.date);

            const eventCard = (
              <Card className={cn("transition-shadow", event.link && "group-hover:shadow-md")}>
                <div className="flex flex-col sm:flex-row">
                  {/* Date Block */}
                  <div className="sm:w-32 bg-[var(--color-surface-elevated)] p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--color-border)] gap-2 sm:gap-0 shrink-0">
                    <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{dateParts.month}</span>
                    <span className="text-3xl font-black text-[var(--color-text-primary)]">{dateParts.day}</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] sm:mt-1">{dateParts.weekday}</span>
                  </div>

                  {/* Content Block */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                      event.type === 'live_session' ? "bg-[var(--color-primary-soft)] border-[var(--color-primary-muted)]" :
                      event.type === 'deadline' ? "bg-[var(--color-warning-soft)] border-[var(--color-warning)]/20" :
                      "bg-[var(--color-success-soft)] border-[var(--color-success)]/20"
                    )}>
                      {getEventIcon(event.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventBadge(event.type)}
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                          {event.time}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        {event.courseTitle}
                      </p>
                      {event.description && (
                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {event.link && (
                      <div className="hidden sm:flex shrink-0 w-8 items-center justify-end text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );

            return event.link ? (
              <Link key={event.id} to={event.link} className="block group">
                {eventCard}
              </Link>
            ) : (
              <div key={event.id} className="block group cursor-default">
                {eventCard}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
