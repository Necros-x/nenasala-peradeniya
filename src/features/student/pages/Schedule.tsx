"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronRight, ClipboardList, Clock, Loader2, Radio, Video } from "lucide-react";
import { Card } from "@/features/student/components/ui/Card";
import { Badge } from "@/features/student/components/ui/Badge";
import { getEvents } from "@/features/student/lib/services";
import type { CalendarEvent } from "@/features/student/types";
import { cn } from "@/features/student/lib/utils";

export default function Schedule({ initialEvents }: { initialEvents?: CalendarEvent[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents ?? []);
  const [loading, setLoading] = useState(initialEvents === undefined);

  useEffect(() => {
    if (initialEvents !== undefined) {
      setEvents(initialEvents);
      setLoading(false);
      return;
    }

    getEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [initialEvents]);

  const getEventIcon = (event: CalendarEvent) => {
    if (event.type === "live_session" && event.status === "live") {
      return <Radio className="h-5 w-5 text-[var(--color-error)]" />;
    }
    if (event.type === "live_session") return <Video className="h-5 w-5 text-[var(--color-primary)]" />;
    if (event.type === "deadline") return <Clock className="h-5 w-5 text-[var(--color-warning)]" />;
    return <ClipboardList className="h-5 w-5 text-[var(--color-success)]" />;
  };

  const getEventBadge = (event: CalendarEvent) => {
    if (event.type === "live_session" && event.status === "live") {
      return <Badge variant="error">Live now</Badge>;
    }
    if (event.type === "live_session") return <Badge variant="default">Live Session</Badge>;
    if (event.type === "deadline") return <Badge variant="warning">Deadline</Badge>;
    return <Badge variant="success">Assignment</Badge>;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString("en-LK", { month: "short", timeZone: "Asia/Colombo" }),
      day: new Intl.DateTimeFormat("en-LK", { day: "numeric", timeZone: "Asia/Colombo" }).format(date),
      weekday: date.toLocaleString("en-LK", { weekday: "long", timeZone: "Asia/Colombo" }),
    };
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[400px] max-w-4xl items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Event Schedule</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Your upcoming live classes, deadlines and learning events.</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
                <CalendarIcon className="h-8 w-8 text-[var(--color-secondary)]" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-[var(--color-text-primary)]">Your schedule is clear!</h3>
              <p className="text-[var(--color-text-secondary)]">No upcoming live classes or deadlines at the moment.</p>
            </div>
          </Card>
        ) : (
          events.map((event) => {
            const dateParts = formatEventDate(event.date);
            const external = Boolean(event.link?.startsWith("http://") || event.link?.startsWith("https://"));

            const eventCard = (
              <Card className={cn("transition-shadow", event.link && "group-hover:shadow-md")}>
                <div className="flex flex-col sm:flex-row">
                  <div className="flex shrink-0 items-center justify-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 sm:w-32 sm:flex-col sm:gap-0 sm:border-b-0 sm:border-r sm:p-6">
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{dateParts.month}</span>
                    <span className="text-3xl font-black text-[var(--color-text-primary)]">{dateParts.day}</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] sm:mt-1">{dateParts.weekday}</span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                        event.type === "live_session"
                          ? event.status === "live"
                            ? "border-[var(--color-error)]/20 bg-[var(--color-error-soft)]"
                            : "border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)]"
                          : event.type === "deadline"
                            ? "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)]"
                            : "border-[var(--color-success)]/20 bg-[var(--color-success-soft)]"
                      )}
                    >
                      {getEventIcon(event)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {getEventBadge(event)}
                        {event.provider && <span className="text-xs font-semibold text-[var(--color-text-muted)]">{event.provider}</span>}
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">{event.time}</span>
                      </div>
                      <h3 className="line-clamp-1 text-lg font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
                        {event.title}
                      </h3>
                      <p className="mb-1 text-sm font-medium text-[var(--color-text-secondary)]">{event.courseTitle}</p>
                      {event.description && <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{event.description}</p>}
                    </div>

                    {event.link && (
                      <div className="hidden w-8 shrink-0 items-center justify-end text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)] sm:flex">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );

            if (!event.link) return <div key={event.id} className="group">{eventCard}</div>;
            if (external) {
              return (
                <a key={event.id} href={event.link} target="_blank" rel="noreferrer" className="group block">
                  {eventCard}
                </a>
              );
            }
            return (
              <Link key={event.id} href={event.link} className="group block">
                {eventCard}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
