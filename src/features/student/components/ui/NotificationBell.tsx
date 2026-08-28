"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, CheckCircle2, ClipboardList, FileQuestion, Info, Settings } from "lucide-react";
import { Button } from "./Button";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/features/student/lib/services";
import type { Notification } from "@/features/student/types";
import { cn } from "@/features/student/lib/utils";
import { createClient } from "@/lib/supabase/client";

function safeStudentPath(value: string | undefined) {
  return value?.startsWith("/student/") ? value : "/student/notifications";
}

function demoStudentPath(value: string | undefined) {
  if (!value) return "/student/notifications";
  if (value.startsWith("/student/")) return value;
  if (value.startsWith("/")) return `/student${value}`;
  return "/student/notifications";
}

function mapRealNotification(row: any): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.created_at,
    read: Boolean(row.read_at),
    type: row.type as Notification["type"],
    link: row.link ?? undefined,
  };
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [realUserId, setRealUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      if (userId) {
        setRealUserId(userId);
        const { data, error } = await supabase
          .from("notifications")
          .select("id,title,message,type,link,read_at,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(8);
        if (!error) {
          setNotifications((data ?? []).map(mapRealNotification));
          return;
        }
      }
    } catch {
      // Demo/local preview falls back to the existing mock notification service.
    }

    setRealUserId(null);
    setNotifications(await getNotifications());
  };

  useEffect(() => {
    void fetchNotifications();

    const handleFocus = () => void fetchNotifications();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleMarkAllRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (realUserId) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", realUserId)
          .is("read_at", null);
        if (!error) {
          setNotifications((current) => current.map((item) => ({ ...item, read: true })));
          return;
        }
      } catch {
        // Fall through to a fresh read below.
      }
      await fetchNotifications();
      return;
    }

    await markAllNotificationsRead();
    await fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      if (realUserId) {
        try {
          const supabase = createClient();
          await supabase
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", notification.id)
            .eq("user_id", realUserId);
        } catch {
          // Navigation should still work even if marking read fails.
        }
      } else {
        await markNotificationRead(notification.id);
      }
    }

    setIsOpen(false);
    router.push(realUserId ? safeStudentPath(notification.link) : demoStudentPath(notification.link));
  };

  const getIcon = (type: Notification["type"]) => {
    if (type === "course") return <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />;
    if (type === "assignment") return <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" />;
    if (type === "quiz") return <FileQuestion className="h-4 w-4 text-[var(--color-primary)]" />;
    if (type === "announcement") return <Info className="h-4 w-4 text-[var(--color-info)]" />;
    if (type === "system") return <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />;
    return <Bell className="h-4 w-4 text-[var(--color-text-muted)]" />;
  };

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-[var(--color-text-secondary)]"
        onClick={toggleOpen}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--color-error)] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--color-surface)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 flex max-h-[30rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">Notifications</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline">
                <CheckCircle2 className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No notifications right now.</div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {notifications.slice(0, 8).map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full gap-3 p-4 text-left transition-colors hover:bg-[var(--color-surface-elevated)]",
                      !notification.read && "bg-[var(--color-primary)]/5"
                    )}
                  >
                    <span className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border",
                      !notification.read
                        ? "border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                        : "border-transparent bg-[var(--color-surface-elevated)]"
                    )}>
                      {getIcon(notification.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn(
                        "mb-0.5 block line-clamp-1 text-sm font-medium",
                        !notification.read ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                      )}>{notification.title}</span>
                      <span className="block line-clamp-2 text-xs text-[var(--color-text-secondary)]">{notification.message}</span>
                      <span className="mt-1.5 block text-[10px] font-medium text-[var(--color-text-muted)]">
                        {new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(notification.timestamp))}
                      </span>
                    </span>
                    {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2">
            <Button
              variant="ghost"
              className="w-full text-sm text-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-hover)]"
              onClick={() => {
                setIsOpen(false);
                router.push("/student/notifications");
              }}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
