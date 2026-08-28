import { Bell, BookOpen, CheckCircle2, ClipboardList, Info, Settings } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { Notification } from "@/features/student/types";
import {
  markAllStudentNotificationsReadAction,
  openStudentNotificationAction,
} from "@/lib/actions/student/notifications";

function notificationIcon(type: Notification["type"]) {
  if (type === "course") return <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />;
  if (type === "assignment") return <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />;
  if (type === "announcement") return <Info className="h-5 w-5 text-[var(--color-info)]" />;
  if (type === "system") return <Settings className="h-5 w-5 text-[var(--color-text-muted)]" />;
  return <Bell className="h-5 w-5 text-[var(--color-text-muted)]" />;
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function RealNotifications({ initialNotifications }: { initialNotifications: Notification[] }) {
  const unreadCount = initialNotifications.filter((item) => !item.read).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Notifications</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllStudentNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark all as read
            </button>
          </form>
        )}
      </div>

      <Card className="overflow-hidden">
        {initialNotifications.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-surface-elevated)]">
              <Bell className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">No notifications yet</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Assignment updates, resubmission permissions and other LMS alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {initialNotifications.map((notification) => (
              <form key={notification.id} action={openStudentNotificationAction}>
                <input type="hidden" name="notification_id" value={notification.id} />
                <button
                  type="submit"
                  className={`flex w-full gap-4 p-4 text-left transition-colors sm:p-6 ${
                    notification.read
                      ? "hover:bg-[var(--color-surface-elevated)]"
                      : "bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10"
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
                      notification.read
                        ? "border-transparent bg-[var(--color-surface-elevated)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                    }`}
                  >
                    {notificationIcon(notification.type)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${notification.read ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"}`}>
                        {notification.title}
                      </span>
                      {!notification.read && <Badge variant="default" className="h-4 px-1.5 py-0 text-[10px]">New</Badge>}
                    </span>
                    <span className="block text-sm leading-relaxed text-[var(--color-text-secondary)]">{notification.message}</span>
                    <span className="mt-2 block text-xs font-medium text-[var(--color-text-muted)]">{timestamp(notification.timestamp)}</span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
