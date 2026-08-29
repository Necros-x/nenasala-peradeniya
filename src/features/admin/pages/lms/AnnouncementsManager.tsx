"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Archive, CalendarClock, Megaphone, Pencil, Pin, Plus, Search, Send, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { saveAnnouncementAction } from "@/lib/actions/admin/announcements";
import type {
  AdminAnnouncementOptions,
  AdminAnnouncementRecord,
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/lib/services/announcements";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";

const audienceLabels: Record<AnnouncementAudience, string> = {
  all_students: "All students",
  programme: "Programme",
  intake: "Intake",
  course: "Course",
  class: "Class",
  students: "Selected students",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function displayState(item: AdminAnnouncementRecord) {
  if (item.status === "archived") return { label: "Archived", variant: "secondary" as const };
  if (item.status === "draft") return { label: "Draft", variant: "outline" as const };
  if (item.publish_at && new Date(item.publish_at).getTime() > Date.now()) {
    return { label: "Scheduled", variant: "info" as const };
  }
  if (item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) {
    return { label: "Expired", variant: "secondary" as const };
  }
  return { label: "Published", variant: "success" as const };
}

function formatDate(value: string | null) {
  if (!value) return "Immediately";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default function AnnouncementsManager({
  announcements,
  options,
  accessKey,
  readOnlyDemo,
}: {
  announcements: AdminAnnouncementRecord[];
  options: AdminAnnouncementOptions;
  accessKey: string;
  readOnlyDemo: boolean;
}) {
  const [editing, setEditing] = useState<AdminAnnouncementRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [audience, setAudience] = useState<AnnouncementAudience>("all_students");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter((item) =>
      [item.title, item.body, item.audience_label, item.status, item.priority].some((value) => value.toLowerCase().includes(query))
    );
  }, [announcements, search]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return options.students;
    return options.students.filter((student) =>
      `${student.label} ${student.studentNumber}`.toLowerCase().includes(query)
    );
  }, [options.students, studentSearch]);

  const published = announcements.filter((item) => displayState(item).label === "Published").length;
  const scheduled = announcements.filter((item) => displayState(item).label === "Scheduled").length;
  const urgent = announcements.filter((item) => item.priority === "urgent" && item.status === "published").length;

  function openCreate() {
    setEditing(null);
    setAudience("all_students");
    setSelectedStudents([]);
    setStudentSearch("");
    setShowForm(true);
  }

  function openEdit(item: AdminAnnouncementRecord) {
    setEditing(item);
    setAudience(item.audience_type);
    setSelectedStudents(item.selected_student_ids);
    setStudentSearch("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setAudience("all_students");
    setSelectedStudents([]);
  }

  function toggleStudent(id: string) {
    setSelectedStudents((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit(form: HTMLFormElement) {
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    const formData = new FormData(form);
    selectedStudents.forEach((studentId) => formData.append("student_ids", studentId));
    startTransition(async () => {
      const result = await saveAnnouncementAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save announcement.");
        return;
      }
      toast.success(editing ? "Announcement updated." : "Announcement created.");
      closeForm();
    });
  }

  const targetOptions = audience === "programme"
    ? options.programmes
    : audience === "intake"
      ? options.intakes
      : audience === "course"
        ? options.courses
        : audience === "class"
          ? options.classes
          : [];
  const targetName = audience === "programme" ? "programme_id"
    : audience === "intake" ? "intake_id"
      : audience === "course" ? "course_id"
        : audience === "class" ? "class_id" : "";
  const targetValue = editing
    ? audience === "programme" ? editing.programme_id
      : audience === "intake" ? editing.intake_id
        : audience === "course" ? editing.course_id
          : audience === "class" ? editing.class_id : null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Communication</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
          <p className="mt-1 text-text-secondary">Publish targeted updates and deliver them into each student&apos;s real notification feed.</p>
        </div>
        <Button onClick={openCreate} disabled={readOnlyDemo}>
          <Plus className="mr-2 h-4 w-4" /> New announcement
        </Button>
      </div>

      {readOnlyDemo && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-text-secondary">
            <AlertTriangle className="h-4 w-4 text-warning" /> Demo mode is read-only. Announcement data below is for preview only.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: announcements.length, icon: Megaphone },
          { label: "Published", value: published, icon: Send },
          { label: "Scheduled", value: scheduled, icon: CalendarClock },
          { label: "Urgent live", value: urgent, icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-brand-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editing ? "Edit announcement" : "Create announcement"}</h2>
                <p className="text-sm text-text-secondary">Published announcements are visible only to the audience you choose.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Close announcement form"><X className="h-4 w-4" /></Button>
            </div>

            <form
              key={editing?.id ?? "new"}
              onSubmit={(event) => {
                event.preventDefault();
                submit(event.currentTarget);
              }}
              className="space-y-5"
            >
              <input type="hidden" name="accessKey" value={accessKey} />
              <input type="hidden" name="id" value={editing?.id ?? ""} />

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div>
                  <Label htmlFor="announcement-title">Title</Label>
                  <Input id="announcement-title" name="title" defaultValue={editing?.title ?? ""} placeholder="Important class update" maxLength={180} required />
                </div>
                <div>
                  <Label htmlFor="announcement-priority">Priority</Label>
                  <select id="announcement-priority" name="priority" defaultValue={editing?.priority ?? "general"} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                    <option value="general">General</option>
                    <option value="course">Course update</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="announcement-body">Message</Label>
                <textarea id="announcement-body" name="body" defaultValue={editing?.body ?? ""} rows={7} maxLength={20000} required className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Write the announcement..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="announcement-audience">Audience</Label>
                  <select
                    id="announcement-audience"
                    name="audience_type"
                    value={audience}
                    onChange={(event) => {
                      setAudience(event.target.value as AnnouncementAudience);
                      setSelectedStudents([]);
                    }}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    {Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                {targetName && (
                  <div key={`${audience}-${editing?.id ?? "new"}`}>
                    <Label htmlFor="announcement-target">Target</Label>
                    <select id="announcement-target" name={targetName} defaultValue={targetValue ?? ""} required className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                      <option value="">Choose {audienceLabels[audience].toLowerCase()}</option>
                      {targetOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {audience === "students" && (
                <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <Label>Selected students</Label>
                      <p className="mt-1 text-xs text-text-muted">{selectedStudents.length} student{selectedStudents.length === 1 ? "" : "s"} selected</p>
                    </div>
                    {selectedStudents.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents([])}>Clear</Button>}
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search student name or number" className="pl-9" />
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {filteredStudents.map((student) => (
                      <label key={student.id} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-surface">
                        <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{student.label}</span>
                          <span className="block text-xs text-text-muted">{student.studentNumber}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="announcement-publish">Publish time</Label>
                  <Input id="announcement-publish" type="datetime-local" name="publish_at" defaultValue={toLocalInput(editing?.publish_at ?? null)} />
                  <p className="mt-1 text-xs text-text-muted">Leave blank to publish immediately when status is Published.</p>
                </div>
                <div>
                  <Label htmlFor="announcement-expiry">Expiry</Label>
                  <Input id="announcement-expiry" type="datetime-local" name="expires_at" defaultValue={toLocalInput(editing?.expires_at ?? null)} />
                </div>
                <div>
                  <Label htmlFor="announcement-status">Status</Label>
                  <select id="announcement-status" name="status" defaultValue={editing?.status ?? "draft"} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published / scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" name="is_pinned" defaultChecked={editing?.is_pinned ?? false} />
                <Pin className="h-4 w-4 text-brand-primary" /> Pin this announcement for students
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={pending || readOnlyDemo}>{pending ? "Saving..." : editing ? "Save changes" : "Create announcement"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Announcement history</h2>
            <p className="text-sm text-text-secondary">Drafts, scheduled notices and previously published announcements.</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements" className="pl-9" />
          </div>
        </div>

        {visible.length === 0 ? (
          <CardContent className="p-10 text-center">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="font-semibold text-foreground">No announcements found</p>
            <p className="mt-1 text-sm text-text-secondary">Create your first announcement or change the search.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((item) => {
              const state = displayState(item);
              return (
                <div key={item.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={state.variant}>{state.label}</Badge>
                        <Badge variant={item.priority === "urgent" ? "danger" : item.priority === "course" ? "info" : "secondary"}>{item.priority === "course" ? "Course update" : item.priority}</Badge>
                        {item.is_pinned && <Badge variant="warning"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
                      </div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{item.body}</p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" /> {item.audience_label}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {item.status === "published" ? formatDate(item.publish_at ?? item.published_at) : `Updated ${formatDate(item.updated_at)}`}</span>
                        {item.expires_at && <span className="inline-flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Expires {formatDate(item.expires_at)}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)} disabled={readOnlyDemo}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
