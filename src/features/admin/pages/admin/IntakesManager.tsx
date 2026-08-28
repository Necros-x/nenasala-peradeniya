"use client";
import { useState, useTransition } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import type { IntakeRecord } from "@/lib/services/intakes";
import type { ProgrammeRecord } from "@/lib/services/programmes";
import { saveIntakeAction } from "@/app/internal/[accessKey]/(portal)/intakes/actions";
const empty: IntakeRecord = {
  id: "",
  programme_id: "",
  name: "",
  slug: "",
  start_date: null,
  end_date: null,
  registration_open_at: null,
  registration_close_at: null,
  capacity: null,
  status: "draft",
  created_at: "",
  updated_at: "",
  programme_name: "",
  programme_slug: "",
};
const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
export default function IntakesManager({
  intakes,
  programmes,
  accessKey,
  readOnlyDemo = false,
}: {
  intakes: IntakeRecord[];
  programmes: ProgrammeRecord[];
  accessKey: string;
  readOnlyDemo?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<IntakeRecord>(empty),
    [pending, start] = useTransition();
  const edit = (i: IntakeRecord) => {
    setEditing(i);
    setOpen(true);
  };
  const submit = (fd: FormData) =>
    start(async () => {
      const r = await saveIntakeAction(fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(editing.id ? "Intake updated." : "Intake created.");
      setOpen(false);
    });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intakes</h1>
          <p className="text-text-secondary">
            Create and schedule programme cohorts.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(empty);
            setOpen(true);
          }}
          disabled={readOnlyDemo}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Intake
        </Button>
      </div>
      <div className="grid gap-4">
        {intakes.length ? (
          intakes.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <Badge>{i.status.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{i.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {i.programme_name}
                  </p>
                </div>
                <div className="text-sm text-text-secondary">
                  {i.start_date || "Start date not set"}
                </div>
                <Button
                  variant="outline"
                  onClick={() => edit(i)}
                  disabled={readOnlyDemo}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              No intakes yet. Add the real dates when Nenasala confirms them.
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? "Edit Intake" : "Create Intake"}
            </DialogTitle>
          </DialogHeader>
          <form action={submit} className="space-y-4">
            <input type="hidden" name="accessKey" value={accessKey} />
            <input type="hidden" name="id" value={editing.id} />
            <div className="space-y-2">
              <Label>Programme</Label>
              <select
                name="programme_id"
                value={editing.programme_id}
                onChange={(e) =>
                  setEditing({ ...editing, programme_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3"
                required
              >
                <option value="">Select programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                name="name"
                value={editing.name}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: slugify(e.target.value),
                  })
                }
                placeholder="January 2027 Intake"
                required
              />
            </div>
            <input type="hidden" name="slug" value={editing.slug} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input
                  name="start_date"
                  type="date"
                  value={editing.start_date ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      start_date: e.target.value || null,
                    })
                  }
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  name="end_date"
                  type="date"
                  value={editing.end_date ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, end_date: e.target.value || null })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Registration opens</Label>
                <Input name="registration_open_at" type="datetime-local" />
              </div>
              <div>
                <Label>Registration closes</Label>
                <Input name="registration_close_at" type="datetime-local" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Capacity</Label>
                <Input
                  name="capacity"
                  type="number"
                  min="1"
                  value={editing.capacity ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  name="status"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as IntakeRecord["status"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3"
                >
                  {[
                    "draft",
                    "upcoming",
                    "open",
                    "closing_soon",
                    "full",
                    "active",
                    "completed",
                    "closed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={pending || readOnlyDemo}>
                {pending ? "Saving..." : "Save Intake"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
