"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, FilePlus2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { InstructorTeachingData, TeachingLesson, TeachingModule } from "@/lib/services/instructor-teaching";
import {
  deleteTeachingLessonAction,
  deleteTeachingModuleAction,
  saveTeachingLessonAction,
  saveTeachingModuleAction,
} from "@/lib/actions/instructor/teaching";

const field = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";
const area = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

export default function InstructorContentManager({ data, accessKey }: { data: InstructorTeachingData; accessKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState(data.courses[0]?.id ?? "");
  const modules = useMemo(() => data.modules.filter((module) => module.course_id === courseId), [data.modules, courseId]);

  function submit(action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>, formData: FormData, success: string) {
    formData.set("accessKey", accessKey);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) return void toast.error(result.error ?? "Unable to save changes.");
      toast.success(success);
      router.refresh();
    });
  }

  if (data.courses.length === 0) {
    return <Empty text="No courses are assigned to this instructor yet. An admin must assign the first class before course content can be edited." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-primary">Teaching tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Course Content</h1>
          <p className="mt-1 text-text-secondary">Create and edit modules and lessons for courses you teach.</p>
        </div>
        <div className="w-full lg:w-80">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted">Course</label>
          <select className={field} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {data.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <form
          className="grid gap-4 rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            formData.set("course_id", courseId);
            submit(saveTeachingModuleAction, formData, "Module added.");
            event.currentTarget.reset();
          }}
        >
          <div className="md:col-span-2 flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-text-primary">Add module</h2>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text-primary">Title</label><input name="title" required className={field} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text-primary">Status</label><select name="status" defaultValue="draft" className={field}><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select></div>
          <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-text-primary">Description</label><textarea name="description" rows={2} className={area} /></div>
          <div className="md:col-span-2"><button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">Add module</button></div>
        </form>
      </section>

      {modules.length === 0 ? <Empty text="No modules in this course yet." /> : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <ModuleEditor key={module.id} module={module} index={index} accessKey={accessKey} pending={pending} submit={submit} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleEditor({
  module,
  index,
  accessKey,
  pending,
  submit,
}: {
  module: TeachingModule;
  index: number;
  accessKey: string;
  pending: boolean;
  submit: (action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>, formData: FormData, success: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
      <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">Module {index + 1}</p>
            <h2 className="mt-1 text-xl font-bold text-text-primary">{module.title}</h2>
            {module.description && <p className="mt-1 text-sm text-text-secondary">{module.description}</p>}
          </div>
          <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-bold capitalize text-text-secondary">{module.status}</span>
        </div>

        <details className="mt-4 rounded-md border border-border bg-background p-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-text-primary"><span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit module</span></summary>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            formData.set("id", module.id);
            formData.set("course_id", module.course_id);
            submit(saveTeachingModuleAction, formData, "Module updated.");
          }}>
            <input name="title" required defaultValue={module.title} className={field} />
            <select name="status" defaultValue={module.status} className={field}><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select>
            <textarea name="description" rows={2} defaultValue={module.description ?? ""} className={`${area} md:col-span-2`} />
            <div className="flex gap-2 md:col-span-2">
              <button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)]">Save module</button>
              <button
                disabled={pending}
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 px-4 py-2 text-sm font-bold text-danger hover:bg-[var(--status-error-soft)]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </form>
        </details>

        <ConfirmDialog
          open={confirmDelete}
          title="Delete module?"
          description={<>Deleting <span className="font-semibold text-text-primary">{module.title}</span> will also permanently remove every lesson inside this module.</>}
          confirmLabel="Delete module"
          destructive
          pending={pending}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            const formData = new FormData();
            formData.set("id", module.id);
            formData.set("accessKey", accessKey);
            submit(deleteTeachingModuleAction, formData, "Module deleted.");
            setConfirmDelete(false);
          }}
        />

        <details className="mt-3 rounded-md border border-dashed border-brand-primary/40 bg-background p-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-brand-primary"><span className="inline-flex items-center gap-2"><FilePlus2 className="h-4 w-4" /> Add lesson</span></summary>
          <LessonForm moduleId={module.id} pending={pending} onSubmit={(formData) => submit(saveTeachingLessonAction, formData, "Lesson added.")} />
        </details>

        <div className="mt-4 space-y-2">
          {module.lessons.length === 0 ? <p className="text-sm text-text-muted">No lessons yet.</p> : module.lessons.map((lesson, lessonIndex) => (
            <LessonEditor key={lesson.id} lesson={lesson} lessonIndex={lessonIndex} accessKey={accessKey} pending={pending} submit={submit} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LessonEditor({ lesson, lessonIndex, accessKey, pending, submit }: {
  lesson: TeachingLesson;
  lessonIndex: number;
  accessKey: string;
  pending: boolean;
  submit: (action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>, formData: FormData, success: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <details className="rounded-md border border-border bg-background p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-text-primary">{lessonIndex + 1}. {lesson.title}</p><p className="mt-0.5 text-xs capitalize text-text-muted">{lesson.lesson_type} · {lesson.status}</p></div>
          <Pencil className="h-4 w-4 text-text-muted" />
        </div>
      </summary>
      <LessonForm lesson={lesson} moduleId={lesson.module_id} pending={pending} onSubmit={(formData) => {
        formData.set("id", lesson.id);
        submit(saveTeachingLessonAction, formData, "Lesson updated.");
      }} />
      <button
        disabled={pending}
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-danger"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete lesson
      </button>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete lesson?"
        description={<>This will permanently remove <span className="font-semibold text-text-primary">{lesson.title}</span> from the module.</>}
        confirmLabel="Delete lesson"
        destructive
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const formData = new FormData();
          formData.set("id", lesson.id);
          formData.set("accessKey", accessKey);
          submit(deleteTeachingLessonAction, formData, "Lesson deleted.");
          setConfirmDelete(false);
        }}
      />
    </details>
  );
}

function LessonForm({ moduleId, lesson, pending, onSubmit }: { moduleId: string; lesson?: TeachingLesson; pending: boolean; onSubmit: (formData: FormData) => void }) {
  const [type, setType] = useState(lesson?.lesson_type ?? "text");
  const content = lesson?.content ?? {};
  return (
    <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formData.set("module_id", moduleId);
      onSubmit(formData);
      if (!lesson) event.currentTarget.reset();
    }}>
      <input name="title" required defaultValue={lesson?.title ?? ""} placeholder="Lesson title" className={field} />
      <select name="lesson_type" value={type} onChange={(event) => setType(event.target.value)} className={field}><option value="text">Text</option><option value="video">Video</option><option value="document">Document</option><option value="external">External link</option></select>
      <textarea name="description" rows={2} defaultValue={lesson?.description ?? ""} placeholder="Description" className={`${area} md:col-span-2`} />
      <input name="duration_minutes" type="number" min="0" defaultValue={lesson?.duration_minutes ?? ""} placeholder="Duration (minutes)" className={field} />
      <select name="status" defaultValue={lesson?.status ?? "draft"} className={field}><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select>
      {type === "text" && <textarea name="body" rows={5} defaultValue={typeof content.body === "string" ? content.body : ""} placeholder="Lesson text" className={`${area} md:col-span-2`} />}
      {type === "video" && <input name="video_url" type="url" defaultValue={typeof content.url === "string" ? content.url : ""} placeholder="https://..." className={`${field} md:col-span-2`} />}
      {type === "external" && <><input name="external_url" type="url" defaultValue={typeof content.url === "string" ? content.url : ""} placeholder="https://..." className={field} /><input name="external_label" defaultValue={typeof content.label === "string" ? content.label : ""} placeholder="Link label" className={field} /></>}
      {type === "document" && <div className="md:col-span-2"><input name="resource" type="file" className="block w-full text-sm text-text-secondary" /><p className="mt-1 text-xs text-text-muted">PDF, Word, PowerPoint, Excel, TXT or ZIP · max 20 MB. Leave blank while editing to keep the current file.</p></div>}
      <div className="md:col-span-2"><button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">{lesson ? "Save lesson" : "Add lesson"}</button></div>
    </form>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center"><BookOpen className="mx-auto h-7 w-7 text-text-muted" /><p className="mt-3 text-sm text-text-secondary">{text}</p></div>;
}
