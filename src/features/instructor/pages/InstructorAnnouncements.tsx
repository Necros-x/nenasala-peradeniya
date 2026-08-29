"use client";

import { useRef, useTransition } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createInstructorAnnouncementAction } from "@/lib/actions/instructor/announcements";
import type { ClassRecord } from "@/lib/services/classes";
import type { InstructorAnnouncementRecord } from "@/lib/services/instructor-portal";

export default function InstructorAnnouncements({
  classes,
  announcements,
}: {
  classes: ClassRecord[];
  announcements: InstructorAnnouncementRecord[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createInstructorAnnouncementAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to publish announcement.");
        return;
      }
      toast.success("Announcement published and matching students notified.");
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Class Announcements</h1>
        <p className="mt-1 text-text-secondary">Send an immediate announcement only to students in a class assigned to you.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form ref={formRef} onSubmit={submit} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary"><Megaphone className="h-5 w-5 text-brand-primary" /> New announcement</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-primary">Class</label>
                <select name="class_id" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="">Choose class</option>
                  {classes.map((classRow) => <option key={classRow.id} value={classRow.id}>{classRow.name} · {classRow.course_title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-primary">Priority</label>
                <select name="priority" defaultValue="general" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="general">General</option>
                  <option value="course">Course update</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-primary">Title</label>
                <input name="title" required maxLength={180} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-primary">Message</label>
                <textarea name="body" required rows={6} maxLength={20000} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <button disabled={pending || classes.length === 0} type="submit" className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] hover:bg-brand-primary-hover disabled:opacity-50">
                <Send className="h-4 w-4" /> {pending ? "Publishing..." : "Publish now"}
              </button>
            </div>
          </div>
        </form>

        <section>
          <h2 className="mb-3 text-lg font-bold text-text-primary">Your recent announcements</h2>
          {announcements.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">You have not published any class announcements yet.</div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
                  <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-primary">{announcement.course_title} · {announcement.class_name}</p>
                        <h3 className="mt-1 font-bold text-text-primary">{announcement.title}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${announcement.priority === "urgent" ? "bg-[var(--color-error-soft)] text-[var(--color-error)]" : "bg-background text-text-secondary"}`}>{announcement.priority}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{announcement.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
