"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Edit, Plus, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/admin/components/ui/dialog";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import { saveClassAction } from "@/lib/actions/admin/classes";
import type { ClassRecord, InstructorOption } from "@/lib/services/classes";
import type { CourseRecord } from "@/lib/services/courses";
import type { IntakeRecord } from "@/lib/services/intakes";
import type { ProgrammeRecord } from "@/lib/services/programmes";

const STATUS_LABELS: Record<ClassRecord["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function statusVariant(status: ClassRecord["status"]): "secondary" | "info" | "success" | "outline" | "danger" {
  if (status === "active") return "success";
  if (status === "scheduled") return "info";
  if (status === "cancelled") return "danger";
  if (status === "completed") return "outline";
  return "secondary";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`)
  );
}

type Props = {
  classes: ClassRecord[];
  intakes: IntakeRecord[];
  programmes: ProgrammeRecord[];
  courses: CourseRecord[];
  instructors: InstructorOption[];
  accessKey: string;
  readOnlyDemo: boolean;
};

export default function ClassesManager({ classes, intakes, programmes, courses, instructors, accessKey, readOnlyDemo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [intakeId, setIntakeId] = useState("");
  const [courseId, setCourseId] = useState("");

  const selectedIntake = intakes.find((item) => item.id === intakeId) ?? null;
  const selectedProgramme = programmes.find((item) => item.id === selectedIntake?.programme_id) ?? null;
  const allowedCourseIds = useMemo(() => new Set(selectedProgramme?.course_ids ?? []), [selectedProgramme]);
  const courseOptions = courses.filter((course) => allowedCourseIds.has(course.id));

  function beginCreate() {
    setEditing(null);
    setIntakeId("");
    setCourseId("");
    setOpen(true);
  }

  function beginEdit(item: ClassRecord) {
    setEditing(item);
    setIntakeId(item.intake_id);
    setCourseId(item.course_id);
    setOpen(true);
  }

  function onIntakeChange(value: string) {
    setIntakeId(value);
    const intake = intakes.find((item) => item.id === value);
    const programme = programmes.find((item) => item.id === intake?.programme_id);
    const allowed = programme?.course_ids ?? [];
    setCourseId((current) => (allowed.includes(current) ? current : allowed[0] ?? ""));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    setSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("intake_id", intakeId);
    formData.set("course_id", courseId);
    if (editing) formData.set("id", editing.id);

    try {
      const result = await saveClassAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save class.");
      toast.success(editing ? "Class updated" : "Class created");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes</h1>
          <p className="mt-1 text-text-secondary">Connect an intake to a course, lecturer and teaching period.</p>
        </div>
        <Button onClick={beginCreate} disabled={readOnlyDemo || intakes.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> New Class
        </Button>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only. Sign in with a real administrator account to create or edit classes.
        </div>
      )}

      {intakes.length === 0 && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface px-5 py-4 text-sm text-text-secondary">
          Create an intake first. Classes always belong to a specific intake and one of that programme&apos;s courses.
        </div>
      )}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-brand-primary">
              <UsersRound className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No classes created yet</h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              Once an intake exists, create its teaching class here. Students enrolled in that intake will automatically gain access to the class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">{item.programme_name}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{item.name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{item.course_title}</p>
                  </div>
                  <Badge variant={statusVariant(item.status)}>{STATUS_LABELS[item.status]}</Badge>
                </div>

                <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <CalendarDays className="h-4 w-4 text-brand-primary" />
                    <span>{item.intake_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <UserRound className="h-4 w-4 text-brand-primary" />
                    <span>{item.instructor_name ?? "Lecturer not assigned"}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {formatDate(item.start_date)}{item.end_date ? ` – ${formatDate(item.end_date)}` : ""}
                  </p>
                </div>

                <Button variant="outline" className="mt-5 w-full" onClick={() => beginEdit(item)} disabled={readOnlyDemo}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Class
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit class" : "Create class"}</DialogTitle>
            <DialogDescription>Choose an intake first; available courses are limited to that intake&apos;s programme.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-intake">Intake</Label>
                <select
                  id="class-intake"
                  required
                  value={intakeId}
                  onChange={(event) => onIntakeChange(event.target.value)}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="">Select intake</option>
                  {intakes.map((intake) => (
                    <option key={intake.id} value={intake.id}>{intake.programme_name} — {intake.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-course">Course</Label>
                <select
                  id="class-course"
                  required
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  disabled={!intakeId || courseOptions.length === 0}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50"
                >
                  <option value="">Select course</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                {intakeId && courseOptions.length === 0 && <p className="text-xs text-danger">This programme has no linked courses yet.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-name">Class name</Label>
              <Input id="class-name" name="name" required defaultValue={editing?.name ?? ""} placeholder="e.g. CCNA — September 2026" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-instructor">Lecturer</Label>
                <select
                  id="class-instructor"
                  name="instructor_id"
                  defaultValue={editing?.instructor_id ?? ""}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="">Unassigned</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-status">Status</Label>
                <select
                  id="class-status"
                  name="status"
                  defaultValue={editing?.status ?? "draft"}
                  className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-start">Start date</Label>
                <Input id="class-start" name="start_date" type="date" defaultValue={editing?.start_date ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-end">End date</Label>
                <Input id="class-end" name="end_date" type="date" defaultValue={editing?.end_date ?? ""} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !intakeId || !courseId}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Class"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
