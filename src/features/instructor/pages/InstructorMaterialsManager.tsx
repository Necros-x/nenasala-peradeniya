"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, ExternalLink, File, Image as ImageIcon, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { CourseMaterialRecord, InstructorTeachingData } from "@/lib/services/instructor-teaching";
import { saveCourseMaterialAction } from "@/lib/actions/instructor/materials";
import { MaterialDropzone } from "@/features/instructor/components/MaterialDropzone";
import { MaterialCardActions } from "@/features/instructor/components/MaterialCardActions";

const field = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";
const area = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

export default function InstructorMaterialsManager({ data, accessKey }: { data: InstructorTeachingData; accessKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState(data.courses[0]?.id ?? "");
  const [type, setType] = useState<"file" | "link">("file");
  const materials = useMemo(() => data.materials.filter((row) => row.course_id === courseId), [data.materials, courseId]);

  function run(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData, success: string) {
    fd.set("accessKey", accessKey);
    startTransition(async () => {
      const result = await action(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save material.");
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  if (data.courses.length === 0) {
    return <div className="rounded-lg border border-border bg-surface p-8 text-center text-text-secondary">No assigned courses available for materials.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-primary">Teaching tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Course Materials</h1>
          <p className="mt-1 text-text-secondary">Share PDFs, images, documents and useful links with students.</p>
        </div>
        <label className="w-full lg:w-80">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted">Course</span>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={field}>
            {data.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
        <form
          className="grid gap-4 rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fd = new FormData(form);
            fd.set("course_id", courseId);
            fd.set("material_type", type);
            run(saveCourseMaterialAction, fd, "Material added.");
            form.reset();
          }}
        >
          <div className="flex items-center gap-2 md:col-span-2">
            <Plus className="h-5 w-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-text-primary">Add material</h2>
          </div>
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Title</span>
            <input name="title" required className={field} />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Type</span>
            <select value={type} onChange={(event) => setType(event.target.value as "file" | "link")} className={field}>
              <option value="file">Upload file</option>
              <option value="link">External link</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span>
            <textarea name="description" rows={2} className={area} />
          </label>

          {type === "file" ? (
            <div className="md:col-span-2">
              <MaterialDropzone />
            </div>
          ) : (
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">Link</span>
              <input name="external_url" type="url" required placeholder="https://..." className={field} />
            </label>
          )}

          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary md:col-span-2">
            <input type="checkbox" name="is_published" defaultChecked className="accent-[var(--color-primary)]" />
            Visible to students
          </label>
          <div className="md:col-span-2">
            <button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">
              {pending ? "Uploading..." : "Add material"}
            </button>
          </div>
        </form>
      </section>

      {materials.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-text-secondary">No materials for this course yet.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} accessKey={accessKey} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialCard({ material, accessKey }: { material: CourseMaterialRecord; accessKey: string }) {
  const Icon = material.file_kind === "image" ? ImageIcon : material.material_type === "link" ? Link2 : File;
  return (
    <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
      <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--color-primary-soft)] text-brand-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-text-primary">{material.title}</h3>
            <p className="mt-1 text-xs capitalize text-text-muted">
              {material.file_kind} · {material.is_published ? "Published" : "Hidden"}
            </p>
          </div>
        </div>
        {material.description && <p className="mt-3 text-sm text-text-secondary">{material.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {material.view_url && (
            <a href={material.view_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold text-text-primary hover:bg-background">
              {material.material_type === "link" ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              {material.material_type === "link" ? "Open" : "Preview"}
            </a>
          )}
          {material.download_url && material.material_type === "file" && (
            <a href={material.download_url} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold text-text-primary hover:bg-background">
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
          <MaterialCardActions material={material} accessKey={accessKey} />
        </div>
      </div>
    </article>
  );
}
