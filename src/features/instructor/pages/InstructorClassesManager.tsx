"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Pencil, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { InstructorTeachingData, TeachingClass } from "@/lib/services/instructor-teaching";
import { saveTeachingClassAction } from "@/lib/actions/instructor/teaching";

const field = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

export default function InstructorClassesManager({ data, accessKey }: { data: InstructorTeachingData; accessKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState(data.courses[0]?.id ?? "");
  const compatibleIntakes = useMemo(() => data.intakes.filter((intake) => intake.course_ids.includes(courseId)), [data.intakes, courseId]);

  function save(formData: FormData, success: string) {
    formData.set("accessKey", accessKey);
    startTransition(async () => {
      const result = await saveTeachingClassAction(formData);
      if (!result.ok) return void toast.error(result.error ?? "Unable to save class.");
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-primary">Teaching tools</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Classes</h1><p className="mt-1 text-text-secondary">Create additional classes and update the classes you teach.</p></div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <form className="grid gap-4 rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => {
          event.preventDefault(); const formData = new FormData(event.currentTarget); save(formData, "Class created."); event.currentTarget.reset();
        }}>
          <div className="md:col-span-2 xl:col-span-3 flex items-center gap-2"><Plus className="h-5 w-5 text-brand-primary" /><h2 className="text-lg font-bold text-text-primary">Add class</h2></div>
          <Select label="Course" name="course_id" value={courseId} onChange={setCourseId} options={data.courses.map((row) => ({ value: row.id, label: row.title }))} />
          <Select label="Intake" name="intake_id" options={compatibleIntakes.map((row) => ({ value: row.id, label: row.name }))} />
          {data.isSuperAdmin && <Select label="Instructor" name="instructor_id" options={[{ value: "", label: "Unassigned" }, ...data.instructors.map((row) => ({ value: row.id, label: row.full_name }))]} />}
          <Input label="Class name" name="name" required />
          <Input label="Start date" name="start_date" type="date" />
          <Input label="End date" name="end_date" type="date" />
          <Select label="Status" name="status" options={["draft","scheduled","active","completed","cancelled"].map((value) => ({ value, label: value[0].toUpperCase()+value.slice(1) }))} defaultValue="scheduled" />
          <div className="md:col-span-2 xl:col-span-3"><button disabled={pending || data.courses.length === 0 || compatibleIntakes.length === 0} className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">Create class</button><p className="mt-2 text-xs text-text-muted">Instructors can create another class only for a course they already teach. Super Admin can create any class.</p></div>
        </form>
      </section>

      {data.classes.length === 0 ? <div className="rounded-lg border border-border bg-surface p-8 text-center text-text-secondary">No classes assigned yet.</div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.classes.map((classRow) => <ClassCard key={classRow.id} row={classRow} data={data} pending={pending} save={save} />)}
        </div>
      )}
    </div>
  );
}

function ClassCard({ row, data, pending, save }: { row: TeachingClass; data: InstructorTeachingData; pending: boolean; save: (formData: FormData, success: string) => void }) {
  const [courseId, setCourseId] = useState(row.course_id);
  const intakes = data.intakes.filter((intake) => intake.course_ids.includes(courseId));
  return (
    <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
      <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-text-primary">{row.name}</h2><p className="mt-1 text-sm font-semibold text-brand-primary">{row.course_title}</p><p className="mt-1 text-xs text-text-muted">{row.intake_name}</p></div><span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold capitalize text-text-secondary">{row.status}</span></div>
        <details className="mt-4 rounded-md border border-border bg-background p-4"><summary className="cursor-pointer list-none text-sm font-bold text-text-primary"><span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit class</span></summary>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); formData.set("id", row.id); save(formData, "Class updated."); }}>
            <Select label="Course" name="course_id" value={courseId} onChange={setCourseId} options={data.courses.map((item) => ({ value: item.id, label: item.title }))} />
            <Select label="Intake" name="intake_id" defaultValue={row.intake_id} options={intakes.map((item) => ({ value: item.id, label: item.name }))} />
            {data.isSuperAdmin && <Select label="Instructor" name="instructor_id" defaultValue={row.instructor_id ?? ""} options={[{ value: "", label: "Unassigned" }, ...data.instructors.map((item) => ({ value: item.id, label: item.full_name }))]} />}
            <Input label="Class name" name="name" required defaultValue={row.name} />
            <Input label="Start date" name="start_date" type="date" defaultValue={row.start_date ?? ""} />
            <Input label="End date" name="end_date" type="date" defaultValue={row.end_date ?? ""} />
            <Select label="Status" name="status" defaultValue={row.status} options={["draft","scheduled","active","completed","cancelled"].map((value) => ({ value, label: value[0].toUpperCase()+value.slice(1) }))} />
            <div className="md:col-span-2"><button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)]">Save class</button></div>
          </form>
        </details>
      </div>
    </article>
  );
}

function Input({ label, name, type = "text", required, defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) { return <label><span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}</span><input className={field} name={name} type={type} required={required} defaultValue={defaultValue} /></label>; }
function Select({ label, name, options, value, onChange, defaultValue }: { label: string; name: string; options: { value: string; label: string }[]; value?: string; onChange?: (value: string) => void; defaultValue?: string }) { return <label><span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}</span><select className={field} name={name} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? (event) => onChange(event.target.value) : undefined}>{options.map((option) => <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>; }
