import Link from "next/link";
import { AlertCircle, ChevronRight, Megaphone, Pin } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { StudentAnnouncementRecord } from "@/lib/services/announcements";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function DashboardAnnouncements({ announcements }: { announcements: StudentAnnouncementRecord[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Announcements</h2>
        <Link href="/student/announcements" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">View all</Link>
      </div>
      <Card>
        {announcements.length === 0 ? (
          <div className="p-6 text-center">
            <Megaphone className="mx-auto mb-3 h-7 w-7 text-[var(--color-text-muted)]" />
            <p className="font-semibold text-[var(--color-text-primary)]">No announcements</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Important updates from Nenasala will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {announcements.slice(0, 3).map((announcement) => (
              <Link key={announcement.id} href={`/student/announcements/${announcement.id}`} className="group block p-4 transition-colors hover:bg-[var(--color-surface-elevated)]">
                <div className="flex items-start gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] ${announcement.priority === "urgent" ? "bg-[var(--color-error-soft)] text-[var(--color-error)]" : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"}`}>
                    {announcement.priority === "urgent" ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      {announcement.priority === "urgent" && <Badge variant="error">Urgent</Badge>}
                      {announcement.is_pinned && <Pin className="h-3.5 w-3.5 text-[var(--color-warning)]" />}
                      <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{announcement.audience_label}</span>
                    </div>
                    <p className="line-clamp-1 font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{announcement.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{announcement.body}</p>
                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{formatDate(announcement.publish_at ?? announcement.published_at ?? announcement.created_at)}</p>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
