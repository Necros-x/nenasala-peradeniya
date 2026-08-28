"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  Film,
  Link2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
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
import {
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
  saveLessonAction,
  saveModuleAction,
} from "@/lib/actions/admin/content";
import type { AdminLessonRecord, AdminLessonType, AdminModuleRecord, ContentStatus } from "@/lib/services/course-content";
import type { CourseRecord } from "@/lib/services/courses";

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
  archived: "Archived",
};

const TYPE_LABELS: Record<AdminLessonType, string> = {
  text: "Text lesson",
  video: "Video",
  document: "Document",
  external: "External resource",
};

const ACCEPTED_RESOURCE_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt";

function statusVariant(status: ContentStatus): "secondary" | "success" | "warning" | "outline" {
  if (status === "published") return "success";
  if (status === "hidden") return "warning";
  if (status === "archived") return "outline";
  return "secondary";
}

function objectContent(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function contentString(value: unknown, key: string) {
  const field = objectContent(value)[key];
  return typeof field === "string" ? field : "";
}

function LessonTypeIcon({ type }: { type: AdminLessonType }) {
  if (type === "video") return <Film className="h-4 w-4" />;
  if (type === "external") return <Link2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

type DeleteTarget =
  | { kind: "module"; id: string; title: string }
  | { kind: "lesson"; id: string; title: string }
  | null;

type Props = {
  courses: CourseRecord[];
  modules: AdminModuleRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
};

export default function CourseContentManager({ courses, modules, accessKey, readOnlyDemo }: Props) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [moduleOpen, setModuleOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModuleRecord | null>(null);
  const [editingLesson, setEditingLesson] = useState<AdminLessonRecord | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonType, setLessonType] = useState<AdminLessonType>("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCourse = courses.find((course) => course.id === courseId) ?? null;
  const courseModules = useMemo(
    () => modules.filter((module) => module.course_id === courseId).sort((a, b) => a.position - b.position),
    [modules, courseId]
  );

  function beginCreateModule() {
    if (!courseId) return;
    setEditingModule(null);
    setModuleOpen(true);
  }

  function beginEditModule(module: AdminModuleRecord) {
    setEditingModule(module);
    setModuleOpen(true);
  }

  function beginCreateLesson(moduleId: string) {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonType("text");
    setSelectedFile(null);
    setLessonOpen(true);
  }

  function beginEditLesson(lesson: AdminLessonRecord) {
    setEditingLesson(lesson);
    setLessonModuleId(lesson.module_id);
    setLessonType(lesson.lesson_type);
    setSelectedFile(null);
    setLessonOpen(true);
  }

  async function submitModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      formData.set("course_id", courseId);
      if (editingModule) formData.set("id", editingModule.id);
      const result = await saveModuleAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save module.");
      toast.success(editingModule ? "Module updated" : "Module created");
      setModuleOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("accessKey", accessKey);
      formData.set("module_id", lessonModuleId);
      formData.set("lesson_type", lessonType);
      if (editingLesson) formData.set("id", editingLesson.id);
      if (selectedFile) formData.set("resource", selectedFile);

      const result = await saveLessonAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to save lesson.");
      toast.success(editingLesson ? "Lesson updated" : "Lesson created");
      setLessonOpen(false);
      setSelectedFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function reorder(kind: "module" | "lesson", id: string, direction: "up" | "down") {
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    setBusyId(id);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("id", id);
      formData.set("direction", direction);
      const result = kind === "module" ? await moveModuleAction(formData) : await moveLessonAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to reorder content.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || readOnlyDemo) return;
    setBusyId(deleteTarget.id);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("id", deleteTarget.id);
      const result = deleteTarget.kind === "module" ? await deleteModuleAction(formData) : await deleteLessonAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to delete content.");
      toast.success(deleteTarget.kind === "module" ? "Module deleted" : "Lesson deleted");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  const existingResourceName = editingLesson?.lesson_type === "document"
    ? contentString(editingLesson.content, "filename")
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">LMS Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Content</h1>
          <p className="mt-1 text-text-secondary">Build the module and lesson structure students see inside each course.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="h-10 min-w-72 rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {courses.length === 0 && <option value="">No courses available</option>}
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <Button onClick={beginCreateModule} disabled={!courseId || readOnlyDemo}>
            <Plus className="mr-2 h-4 w-4" /> New Module
          </Button>
        </div>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only. Sign in with a real administrator account to change course content.
        </div>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <BookOpen className="mb-4 h-8 w-8 text-brand-primary" />
            <h2 className="text-lg font-semibold text-foreground">Create a course first</h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">Modules and lessons always belong to an existing course.</p>
          </CardContent>
        </Card>
      ) : courseModules.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <BookOpen className="mb-4 h-8 w-8 text-brand-primary" />
            <h2 className="text-lg font-semibold text-foreground">No modules in {selectedCourse?.title}</h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">Create the first module, then add text, video, document or external lessons inside it.</p>
            <Button className="mt-5" onClick={beginCreateModule} disabled={readOnlyDemo}>
              <Plus className="mr-2 h-4 w-4" /> Create First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courseModules.map((module, moduleIndex) => (
            <Card key={module.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border bg-surface-elevated/40 p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Module {moduleIndex + 1}</span>
                    <Badge variant={statusVariant(module.status)}>{STATUS_LABELS[module.status]}</Badge>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-foreground">{module.title}</h2>
                  {module.description && <p className="mt-1 max-w-3xl text-sm text-text-secondary">{module.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="icon" title="Move module up" disabled={readOnlyDemo || busyId === module.id || moduleIndex === 0} onClick={() => reorder("module", module.id, "up")}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Move module down" disabled={readOnlyDemo || busyId === module.id || moduleIndex === courseModules.length - 1} onClick={() => reorder("module", module.id, "down")}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => beginEditModule(module)} disabled={readOnlyDemo}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget({ kind: "module", id: module.id, title: module.title })} disabled={readOnlyDemo} className="text-danger hover:text-danger">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>

              <CardContent className="p-0">
                {module.lessons.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm font-medium text-foreground">This module has no lessons yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => beginCreateLesson(module.id)} disabled={readOnlyDemo}>
                      <Plus className="mr-2 h-4 w-4" /> Add Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-brand-primary">
                          <LessonTypeIcon type={lesson.lesson_type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{lessonIndex + 1}. {lesson.title}</p>
                            <Badge variant={statusVariant(lesson.status)}>{STATUS_LABELS[lesson.status]}</Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                            <span>{TYPE_LABELS[lesson.lesson_type]}</span>
                            {lesson.duration_minutes !== null && <span>{lesson.duration_minutes} min</span>}
                            {lesson.lesson_type === "document" && contentString(lesson.content, "filename") && <span>{contentString(lesson.content, "filename")}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" title="Move lesson up" disabled={readOnlyDemo || busyId === lesson.id || lessonIndex === 0} onClick={() => reorder("lesson", lesson.id, "up")}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Move lesson down" disabled={readOnlyDemo || busyId === lesson.id || lessonIndex === module.lessons.length - 1} onClick={() => reorder("lesson", lesson.id, "down")}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => beginEditLesson(lesson)} disabled={readOnlyDemo}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete lesson" onClick={() => setDeleteTarget({ kind: "lesson", id: lesson.id, title: lesson.title })} disabled={readOnlyDemo} className="text-danger hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border bg-surface-elevated/20 p-3">
                  <Button variant="ghost" size="sm" onClick={() => beginCreateLesson(module.id)} disabled={readOnlyDemo}>
                    <Plus className="mr-2 h-4 w-4" /> Add Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit module" : "Create module"}</DialogTitle>
            <DialogDescription>Draft modules remain invisible to students until you publish them.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitModule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Title</Label>
              <Input id="module-title" name="title" required defaultValue={editingModule?.title ?? ""} placeholder="e.g. Networking Fundamentals" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Description</Label>
              <textarea id="module-description" name="description" defaultValue={editingModule?.description ?? ""} rows={3} className="w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-status">Status</Label>
              <select id="module-status" name="status" defaultValue={editingModule?.status ?? "draft"} className="h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30">
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModuleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingModule ? "Save Changes" : "Create Module"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonOpen} onOpenChange={(open) => { setLessonOpen(open); if (!open) setSelectedFile(null); }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit lesson" : "Create lesson"}</DialogTitle>
            <DialogDescription>Only published lessons inside published modules are visible to enrolled students.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitLesson} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input id="lesson-title" name="title" required defaultValue={editingLesson?.title ?? ""} placeholder="Lesson title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-type">Type</Label>
                <select id="lesson-type" value={lessonType} onChange={(event) => { setLessonType(event.target.value as AdminLessonType); setSelectedFile(null); }} className="h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30">
                  <option value="text">Text lesson</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="external">External resource</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">Short description</Label>
              <textarea id="lesson-description" name="description" defaultValue={editingLesson?.description ?? ""} rows={2} className="w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>

            {lessonType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-body">Lesson content</Label>
                <textarea id="lesson-body" name="body" defaultValue={editingLesson?.lesson_type === "text" ? contentString(editingLesson.content, "body") : ""} rows={10} placeholder="Write the lesson content here..." className="w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-brand-primary/30" />
                <p className="text-xs text-text-muted">Text is rendered safely as written; raw HTML is not executed.</p>
              </div>
            )}

            {lessonType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input id="video-url" name="video_url" type="url" required defaultValue={editingLesson?.lesson_type === "video" ? contentString(editingLesson.content, "url") : ""} placeholder="https://youtube.com/watch?v=..." />
                <p className="text-xs text-text-muted">YouTube, Vimeo and direct embeddable HTTPS links are supported.</p>
              </div>
            )}

            {lessonType === "external" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="external-url">Resource URL</Label>
                  <Input id="external-url" name="external_url" type="url" required defaultValue={editingLesson?.lesson_type === "external" ? contentString(editingLesson.content, "url") : ""} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external-label">Button label</Label>
                  <Input id="external-label" name="external_label" defaultValue={editingLesson?.lesson_type === "external" ? contentString(editingLesson.content, "label") : ""} placeholder="Open resource" />
                </div>
              </div>
            )}

            {lessonType === "document" && (
              <div className="space-y-2">
                <Label>Resource file</Label>
                <input ref={fileInputRef} type="file" accept={ACCEPTED_RESOURCE_TYPES} className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}
                  className="cursor-pointer rounded-[var(--radius-md)] border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-brand-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <UploadCloud className="mx-auto mb-3 h-8 w-8 text-brand-primary" />
                  <p className="font-medium text-foreground">{selectedFile ? selectedFile.name : existingResourceName || "Drop a file here or click to browse"}</p>
                  <p className="mt-1 text-xs text-text-muted">PDF, Word, PowerPoint, Excel, ZIP or TXT · maximum 20 MB</p>
                  {existingResourceName && !selectedFile && <p className="mt-2 text-xs text-text-secondary">Choose a new file only if you want to replace the existing resource.</p>}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input id="lesson-duration" name="duration_minutes" type="number" min="0" step="1" defaultValue={editingLesson?.duration_minutes ?? ""} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-status">Status</Label>
                <select id="lesson-status" name="status" defaultValue={editingLesson?.status ?? "draft"} className="h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30">
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLessonOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingLesson ? "Save Changes" : "Create Lesson"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.kind}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.kind === "module"
                ? `Delete “${deleteTarget.title}” and every lesson inside it? This cannot be undone.`
                : `Delete “${deleteTarget?.title}”? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={!deleteTarget || busyId === deleteTarget?.id} className="bg-danger text-white hover:bg-danger/90">
              <Trash2 className="mr-2 h-4 w-4" /> {busyId === deleteTarget?.id ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
