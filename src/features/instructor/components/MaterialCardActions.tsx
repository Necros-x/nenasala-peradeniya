"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CourseMaterialRecord } from "@/lib/services/instructor-teaching";
import {
  deleteCourseMaterialAction,
  saveCourseMaterialAction,
} from "@/lib/actions/instructor/materials";

const field =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";
const area =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

export function MaterialCardActions({
  material,
  accessKey,
}: {
  material: CourseMaterialRecord;
  accessKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("id", material.id);
    formData.set("course_id", material.course_id);
    formData.set("material_type", material.material_type);
    if (material.material_type === "link" && material.external_url) {
      formData.set("external_url", material.external_url);
    }

    startTransition(async () => {
      const result = await saveCourseMaterialAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to update material.");
        return;
      }
      toast.success("Material updated.");
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    const formData = new FormData();
    formData.set("accessKey", accessKey);
    formData.set("id", material.id);

    startTransition(async () => {
      const result = await deleteCourseMaterialAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to delete material.");
        return;
      }
      toast.success("Material deleted.");
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold text-text-primary hover:bg-background disabled:opacity-50"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmDelete(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 px-3 py-2 text-xs font-bold text-danger hover:bg-[var(--status-error-soft)] disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>

      {editing && (
        <div
          className="fixed inset-0 z-[150] grid place-items-center bg-[var(--color-static-black)]/50 p-4 backdrop-blur-[2px]"
          onMouseDown={() => {
            if (!pending) setEditing(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <form onSubmit={update} className="rounded-[calc(var(--radius-lg)-4px)] bg-background p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Course material</p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">Edit material</h2>
                  <p className="mt-1 text-sm text-text-secondary">Change the display name or student visibility without re-uploading the file.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close edit material"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-text-primary">Display name</span>
                  <input name="title" required defaultValue={material.title} className={field} />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span>
                  <textarea name="description" rows={3} defaultValue={material.description ?? ""} className={area} />
                </label>
                <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={material.is_published}
                    className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-text-primary">Visible to students</span>
                    <span className="mt-0.5 block text-xs leading-5 text-text-muted">
                      Turn this off to keep the material in the instructor library without showing it in Student → Materials.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50"
                >
                  {pending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete course material?"
        description={
          <>
            <span className="font-semibold text-text-primary">{material.title}</span> will be removed from the course and students will no longer be able to access it.
          </>
        }
        confirmLabel="Delete material"
        destructive
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
