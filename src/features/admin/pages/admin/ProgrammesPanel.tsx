"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, LockKeyhole, MoreHorizontal, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import type { CourseRecord } from "@/lib/services/courses";
import type { ProgrammeRecord } from "@/lib/services/programmes";
import { saveProgrammeAction } from "@/app/internal/[accessKey]/(portal)/courses/programme-actions";

const EMPTY_PROGRAMME: ProgrammeRecord = {
  id: "",
  name: "",
  slug: "",
  short_description: null,
  description: null,
  thumbnail_url: null,
  duration_text: null,
  status: "draft",
  is_featured: false,
  created_at: "",
  updated_at: "",
  course_ids: [],
};

function makeSlug(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ProgrammesPanel({
  programmes,
  courses,
  accessKey,
  readOnlyDemo,
}: {
  programmes: ProgrammeRecord[];
  courses: CourseRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
}) {
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProgrammeRecord>(EMPTY_PROGRAMME);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return programmes;
    return programmes.filter((programme) => [programme.name, programme.slug].some((value) => value.toLowerCase().includes(query)));
  }, [programmes, search]);

  function openNew() {
    setEditing(EMPTY_PROGRAMME);
    setSlugTouched(false);
    setEditorOpen(true);
  }

  function openEdit(programme: ProgrammeRecord) {
    setEditing(programme);
    setSlugTouched(true);
    setEditorOpen(true);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProgrammeAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save programme.");
        return;
      }
      toast.success(editing.id ? "Programme updated." : "Programme created.");
      setEditorOpen(false);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search programmes..." className="pl-9 bg-surface" />
        </div>
        <Button onClick={openNew} disabled={readOnlyDemo}>
          <Plus className="mr-2 h-4 w-4" /> New Programme
        </Button>
      </div>

      {readOnlyDemo && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>Programme changes require a real admin session.</p>
        </div>
      )}

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((programme) => (
            <Card key={programme.id}>
              <CardHeader>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={programme.status === "published" ? "success" : programme.status === "archived" ? "secondary" : "warning"}>
                      {programme.status.charAt(0).toUpperCase() + programme.status.slice(1)}
                    </Badge>
                    {programme.is_featured && <Badge variant="info">Featured</Badge>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={readOnlyDemo} onSelect={() => openEdit(programme)}><Pencil className="mr-2 h-4 w-4" /> Edit Programme</DropdownMenuItem>
                      <DropdownMenuItem asChild><a href="/courses" target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" /> View Catalogue</a></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle>{programme.name}</CardTitle>
                <CardDescription>/{programme.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-text-muted">Linked courses</p><p className="font-medium text-foreground">{programme.course_ids.length}</p></div>
                  <div><p className="text-xs text-text-muted">Duration</p><p className="font-medium text-foreground">{programme.duration_text || "—"}</p></div>
                </div>
                <Button variant="ghost" className="mt-4 w-full text-brand-primary" onClick={() => openEdit(programme)} disabled={readOnlyDemo}>Manage Programme</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-10 text-center"><p className="font-medium">No programmes found.</p></CardContent></Card>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Programme" : "Create Programme"}</DialogTitle>
            <DialogDescription>Define the qualification/programme and link the courses that form its curriculum.</DialogDescription>
          </DialogHeader>
          <form action={submit} className="space-y-5">
            <input type="hidden" name="accessKey" value={accessKey} />
            <input type="hidden" name="id" value={editing.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="programme_name">Programme name</Label>
                <Input id="programme_name" name="name" value={editing.name} onChange={(event) => {
                  const name = event.target.value;
                  setEditing((item) => ({ ...item, name, slug: slugTouched ? item.slug : makeSlug(name) }));
                }} required />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="programme_slug">Slug</Label>
                <Input id="programme_slug" name="slug" value={editing.slug} onChange={(event) => {
                  setSlugTouched(true);
                  setEditing((item) => ({ ...item, slug: makeSlug(event.target.value) }));
                }} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programme_duration">Duration</Label>
                <Input id="programme_duration" name="duration_text" value={editing.duration_text ?? ""} onChange={(event) => setEditing((item) => ({ ...item, duration_text: event.target.value }))} placeholder="e.g. 12 Weeks" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programme_status">Status</Label>
                <select id="programme_status" name="status" value={editing.status} onChange={(event) => setEditing((item) => ({ ...item, status: event.target.value as ProgrammeRecord["status"] }))} className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm">
                  <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="programme_short_description">Short description</Label><textarea id="programme_short_description" name="short_description" rows={2} value={editing.short_description ?? ""} onChange={(event) => setEditing((item) => ({ ...item, short_description: event.target.value }))} className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm" /></div>
            <div className="space-y-2"><Label htmlFor="programme_description">Full description</Label><textarea id="programme_description" name="description" rows={4} value={editing.description ?? ""} onChange={(event) => setEditing((item) => ({ ...item, description: event.target.value }))} className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm" /></div>
            <div className="space-y-2"><Label htmlFor="programme_thumbnail">Thumbnail URL</Label><Input id="programme_thumbnail" name="thumbnail_url" value={editing.thumbnail_url ?? ""} onChange={(event) => setEditing((item) => ({ ...item, thumbnail_url: event.target.value }))} /></div>
            <div className="space-y-3">
              <Label>Included courses</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-border p-3">
                {courses.map((course) => (
                  <label key={course.id} className="flex items-start gap-3 rounded-[var(--radius-sm)] p-2 hover:bg-muted/40">
                    <input type="checkbox" name="course_ids" value={course.id} checked={editing.course_ids.includes(course.id)} onChange={(event) => setEditing((item) => ({ ...item, course_ids: event.target.checked ? [...item.course_ids, course.id] : item.course_ids.filter((id) => id !== course.id) }))} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <span><span className="block text-sm font-medium">{course.title}</span><span className="text-xs text-text-muted">{course.category || "Uncategorised"}</span></span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border p-3"><input type="checkbox" name="is_featured" checked={editing.is_featured} onChange={(event) => setEditing((item) => ({ ...item, is_featured: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" /><span><span className="block text-sm font-medium">Featured programme</span><span className="block text-xs text-text-muted">Marks this programme for prominent public placement later.</span></span></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={isPending}>Cancel</Button><Button type="submit" disabled={isPending || readOnlyDemo}>{isPending ? "Saving..." : "Save Programme"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
