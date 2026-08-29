import Link from "next/link";
import { AlertCircle, ChevronRight, Megaphone, Pin } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Card } from "@/features/student/components/ui/Card";
import type { StudentAnnouncementRecord } from "@/lib/services/announcements";

function priorityBadge(priority: StudentAnnouncementRecord["priority"]) {
  if (priority === "urgent") return <Badge variant="error" className="gap-1"><AlertCircle className="h-3 w-3" /> Urgent</Badge>;
  if (priority === "course") return <Badge variant="secondary">Course update</Badge>;
  return <Badge variant="default">General</Badge>;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function RealAnnouncements({ announcements }: { announcements: StudentAnnouncementRecord[] }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Announcements</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Important updates from Nenasala and your learning programmes.</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
              <Megaphone className="h-8 w-8 text-[var(--color-secondary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No announcements</h3>
            <p className="mt-1 text-[var(--color-text-secondary)]">You&apos;re all caught up.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Link key={announcement.id} href={`/student/announcements/${announcement.id}`} className="group block">
              <Card className="p-5 transition-shadow hover:shadow-md sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${
                    announcement.priority === "urgent"
                      ? "border-[var(--color-error)]/20 bg-[var(--color-error-soft)] text-[var(--color-error)]"
                      : announcement.priority === "course"
                        ? "border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
                  }`}>
                    <Megaphone className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {priorityBadge(announcement.priority)}
                      {announcement.is_pinned && <Badge variant="warning" className="gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">{announcement.audience_label}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">{announcement.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{announcement.body}</p>
                    <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">
                      {formatDate(announcement.publish_at ?? announcement.published_at ?? announcement.created_at)}
                    </p>
                  </div>

                  <ChevronRight className="mt-3 hidden h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)] sm:block" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
