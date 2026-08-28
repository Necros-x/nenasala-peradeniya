"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, MoreHorizontal, LayoutGrid, List as ListIcon, Pencil, Eye, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import type { CourseRecord } from "@/lib/services/courses";
import type { ProgrammeRecord } from "@/lib/services/programmes";
import { saveCourseAction } from "@/app/internal/[accessKey]/(portal)/courses/actions";
import { ProgrammesPanel } from "./ProgrammesPanel";

function statusVariant(status: CourseRecord["status"]) {
  if (status === "published") return "success" as const;
  if (status === "archived") return "secondary" as const;
  return "warning" as const;
}

function statusLabel(status: CourseRecord["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_COURSE: CourseRecord = {
  id: "",
  title: "",
  slug: "",
  short_description: null,
  description: null,
  thumbnail_url: null,
  category: null,
  level: null,
  duration_text: null,
  status: "draft",
  is_public: false,
  created_at: "",
  updated_at: "",
};

export default function CoursesList({
  initialCourses,
  initialProgrammes,
  accessKey,
  readOnlyDemo = false,
}: {
  initialCourses: CourseRecord[];
  initialProgrammes: ProgrammeRecord[];
  accessKey: string;
  readOnlyDemo?: boolean;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CourseRecord>(EMPTY_COURSE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const courses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return initialCourses;
    return initialCourses.filter((course) =>
      [course.title, course.slug, course.category, course.level]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [initialCourses, search]);

  function openNewCourse() {
    setEditing(EMPTY_COURSE);
    setSlugTouched(false);
    setEditorOpen(true);
  }

  function openEditCourse(course: CourseRecord) {
    setEditing(course);
    setSlugTouched(true);
    setEditorOpen(true);
  }

  function submitCourse(formData: FormData) {
    startTransition(async () => {
      const result = await saveCourseAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save course.");
        return;
      }
      toast.success(editing.id ? "Course updated." : "Course created.");
      setEditorOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Programmes & Courses</h1>
          <p className="text-text-secondary">Manage academic offerings and the public course catalogue.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewCourse} disabled={readOnlyDemo} title={readOnlyDemo ? "Demo mode is read-only" : undefined}>
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </div>
      </div>

      {readOnlyDemo && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">Client demo is read-only</p>
            <p className="text-text-secondary">This page is reading the live public course catalogue, but database changes require a real admin account.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="courses" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="programmes">Programmes</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." className="pl-9 bg-surface" />
            </div>
            <Button variant="outline" size="icon" onClick={() => setView(view === "grid" ? "list" : "grid")} aria-label="Toggle course view">
              {view === "grid" ? <ListIcon className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <TabsContent value="courses" className="mt-0">
          {courses.length ? (
            <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-3"}>
              {courses.map((course) => (
                <Card key={course.id} className={`flex ${view === "grid" ? "flex-col" : "flex-col lg:flex-row lg:items-center"} hover:border-brand-primary/30 transition-colors`}>
                  <CardHeader className={`${view === "grid" ? "pb-4" : "lg:flex-1"}`}>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(course.status)}>{statusLabel(course.status)}</Badge>
                        <Badge variant={course.is_public ? "info" : "outline"}>{course.is_public ? "Public" : "LMS only"}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={readOnlyDemo} onSelect={() => openEditCourse(course)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer">
                              <Eye className="mr-2 h-4 w-4" /> View Public Page
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Manage LMS Content</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="leading-tight">{course.title}</CardTitle>
                    <CardDescription className="text-xs">/{course.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className={`${view === "grid" ? "flex-1 pb-4" : "lg:w-[420px] lg:pb-6"}`}>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-text-muted text-xs mb-1">Category</p>
                        <p className="font-medium text-foreground line-clamp-1">{course.category || "—"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs mb-1">Level</p>
                        <p className="font-medium text-foreground line-clamp-1">{course.level || "—"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs mb-1">Duration</p>
                        <p className="font-medium text-foreground line-clamp-1">{course.duration_text || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className={`${view === "grid" ? "pt-4 border-t" : "lg:w-[180px] lg:border-l"} border-border`}>
                    <Button variant="ghost" className="w-full text-brand-primary" onClick={() => openEditCourse(course)} disabled={readOnlyDemo}>
                      Manage Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center">
                <p className="font-medium text-foreground">No courses found.</p>
                <p className="mt-1 text-sm text-text-muted">Try another search or create a new course.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="programmes" className="mt-0">
          <ProgrammesPanel
            programmes={initialProgrammes}
            courses={initialCourses}
            accessKey={accessKey}
            readOnlyDemo={readOnlyDemo}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Course" : "Create Course"}</DialogTitle>
            <DialogDescription>
              This record powers both the public website catalogue and the LMS course structure.
            </DialogDescription>
          </DialogHeader>

          <form action={submitCourse} className="space-y-5">
            <input type="hidden" name="accessKey" value={accessKey} />
            <input type="hidden" name="id" value={editing.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="title">Course title</Label>
                <Input
                  id="title"
                  name="title"
                  value={editing.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setEditing((course) => ({ ...course, title, slug: slugTouched ? course.slug : makeSlug(title) }));
                  }}
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="slug">Public URL slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={editing.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setEditing((course) => ({ ...course, slug: makeSlug(event.target.value) }));
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={editing.category ?? ""} onChange={(event) => setEditing((course) => ({ ...course, category: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input id="level" name="level" value={editing.level ?? ""} onChange={(event) => setEditing((course) => ({ ...course, level: event.target.value }))} placeholder="Beginner / Intermediate / All Levels" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_text">Duration</Label>
                <Input id="duration_text" name="duration_text" value={editing.duration_text ?? ""} onChange={(event) => setEditing((course) => ({ ...course, duration_text: event.target.value }))} placeholder="12 Weeks" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={editing.status}
                  onChange={(event) => setEditing((course) => ({ ...course, status: event.target.value as CourseRecord["status"] }))}
                  className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short description</Label>
              <textarea
                id="short_description"
                name="short_description"
                value={editing.short_description ?? ""}
                onChange={(event) => setEditing((course) => ({ ...course, short_description: event.target.value }))}
                rows={2}
                className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full description</Label>
              <textarea
                id="description"
                name="description"
                value={editing.description ?? ""}
                onChange={(event) => setEditing((course) => ({ ...course, description: event.target.value }))}
                rows={5}
                className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input id="thumbnail_url" name="thumbnail_url" value={editing.thumbnail_url ?? ""} onChange={(event) => setEditing((course) => ({ ...course, thumbnail_url: event.target.value }))} placeholder="https://..." />
            </div>

            <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border p-3">
              <input
                type="checkbox"
                name="is_public"
                checked={editing.is_public}
                onChange={(event) => setEditing((course) => ({ ...course, is_public: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Show on public website</span>
                <span className="block text-xs text-text-muted">The course must also be Published before anonymous visitors can read it.</span>
              </span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending || readOnlyDemo}>{isPending ? "Saving..." : editing.id ? "Save Changes" : "Create Course"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
