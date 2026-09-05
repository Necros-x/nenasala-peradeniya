"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarClock, ClipboardCheck, GraduationCap, Megaphone, MessageSquareText, UserPlus } from "lucide-react";
import { getAdminAttentionAction } from "@/lib/actions/admin/attention";
import { Button } from "@/features/admin/components/ui/button";

export type AdminAttentionSnapshot = {
  pendingEnrollments: number;
  ungradedSubmissions: number;
  unassignedClasses: number;
  closingIntakes: number;
  scheduledAnnouncements: number;
  newContactMessages: number;
  total: number;
};

const emptyAttention: AdminAttentionSnapshot = {
  pendingEnrollments: 0,
  ungradedSubmissions: 0,
  unassignedClasses: 0,
  closingIntakes: 0,
  scheduledAnnouncements: 0,
  newContactMessages: 0,
  total: 0,
};

export function AdminNotificationMenu() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState<AdminAttentionSnapshot>(emptyAttention);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        setAttention(await getAdminAttentionAction());
      } catch {
        // Keep the previous snapshot if refreshing fails.
      }
    });
  }, []);

  useEffect(() => {
    refresh();
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const items = [
    { label: "New contact messages", detail: "Waiting in the contact inbox", count: attention.newContactMessages, path: "/messages", icon: MessageSquareText },
    { label: "Pending enrollments", detail: "Waiting for review", count: attention.pendingEnrollments, path: "/enrollments", icon: UserPlus },
    { label: "Assignments to grade", detail: "Submitted or late", count: attention.ungradedSubmissions, path: "/lms/assignments", icon: ClipboardCheck },
    { label: "Unassigned classes", detail: "Need a lecturer", count: attention.unassignedClasses, path: "/lms/classes", icon: GraduationCap },
    { label: "Intakes closing soon", detail: "Within the next 7 days", count: attention.closingIntakes, path: "/intakes", icon: CalendarClock },
    { label: "Scheduled announcements", detail: "Prepared for later", count: attention.scheduledAnnouncements, path: "/lms/announcements", icon: Megaphone },
  ].filter((item) => item.count > 0);

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={attention.total > 0 ? `Operational alerts, ${attention.total} items` : "Operational alerts"}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refresh();
        }}
      >
        <Bell className="h-4 w-4" />
        {attention.total > 0 && (
          <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-[var(--color-static-white)] ring-2 ring-surface">
            {attention.total > 99 ? "99+" : attention.total}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-[120] mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-floating)]">
          <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3.5">
            <div>
              <p className="font-semibold text-foreground">Needs your attention</p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {pending ? "Refreshing…" : attention.total > 0 ? `${attention.total} live item${attention.total === 1 ? "" : "s"}` : "No outstanding items"}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--color-success-soft)] text-success">
                <Bell className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">You’re all caught up</p>
              <p className="mt-1 text-xs text-text-muted">Operational alerts will appear here when something needs attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-brand-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-[11px] text-text-muted">{item.detail}</span>
                  </span>
                  <span className="grid min-w-7 place-items-center rounded-full bg-[var(--color-primary-soft)] px-2 py-1 text-xs font-bold text-brand-primary">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
