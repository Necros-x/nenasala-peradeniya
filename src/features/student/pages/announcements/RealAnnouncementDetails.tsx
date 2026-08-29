import Link from "next/link";
import { AlertCircle, ArrowLeft, Calendar, Megaphone, Pin, UsersRound } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import type { StudentAnnouncementRecord } from "@/lib/services/announcements";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function RealAnnouncementDetails({ announcement }: { announcement: StudentAnnouncementRecord | null }) {
  if (!announcement) {
    return (
      <div className="mx-auto max-w-3xl pt-8">
        <Card className="p-12 text-center">
          <Megaphone className="mx-auto mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Announcement not available</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">It may have expired, been archived, or not be intended for your account.</p>
          <Link href="/student/announcements" className="mt-6 inline-block"><Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <Link href="/student/announcements">
        <Button variant="ghost" className="text-[var(--color-text-secondary)]"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements</Button>
      </Link>

      <Card className="overflow-hidden">
        <div className={`border-b border-[var(--color-border)] p-6 sm:p-8 ${
          announcement.priority === "urgent"
            ? "bg-[var(--color-error-soft)]/50"
            : announcement.priority === "course"
              ? "bg-[var(--color-primary-soft)]/50"
              : "bg-[var(--color-surface)]"
        }`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {announcement.priority === "urgent" ? (
              <Badge variant="error" className="gap-1"><AlertCircle className="h-3 w-3" /> Urgent</Badge>
            ) : announcement.priority === "course" ? (
              <Badge variant="secondary">Course update</Badge>
            ) : (
              <Badge variant="default">General</Badge>
            )}
            {announcement.is_pinned && <Badge variant="warning" className="gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-3xl">{announcement.title}</h1>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[var(--color-text-muted)]" /> {formatDate(announcement.publish_at ?? announcement.published_at ?? announcement.created_at)}</span>
            <span className="inline-flex items-center gap-1.5"><UsersRound className="h-4 w-4 text-[var(--color-text-muted)]" /> {announcement.audience_label}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="space-y-4 text-[var(--color-text-primary)]">
            {announcement.body.split(/\n+/).map((paragraph, index) => <p key={index} className="leading-7">{paragraph}</p>)}
          </div>
          <p className="mt-8 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">Published by {announcement.author_name}</p>
        </div>
      </Card>
    </div>
  );
}
