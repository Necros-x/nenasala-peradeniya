"use client";

import { useRef, useTransition } from "react";
import { Briefcase, Mail, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { registerInstructorAction } from "@/lib/actions/admin/instructors";
import type { AdminInstructorRecord } from "@/lib/services/instructors";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/ui/card";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import { Badge } from "@/features/admin/components/ui/badge";

export default function InstructorsManager({
  instructors,
  accessKey,
  readOnlyDemo,
}: {
  instructors: AdminInstructorRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);

    startTransition(async () => {
      const result = await registerInstructorAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to invite instructor.");
        return;
      }
      toast.success(
        result.delivery === "resend"
          ? `Personalized invitation sent to ${result.email}.`
          : `Invitation sent to ${result.email} through Supabase Auth.`
      );
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Instructors</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Invite lecturers, then assign them to classes from LMS Management → Classes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-primary" />
            Invite instructor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="instructor-name">Full name</Label>
              <Input id="instructor-name" name="full_name" required className="mt-2" placeholder="Lecturer full name" />
            </div>
            <div>
              <Label htmlFor="instructor-email">Email</Label>
              <Input id="instructor-email" name="email" type="email" required className="mt-2" placeholder="lecturer@example.com" />
            </div>
            <div>
              <Label htmlFor="instructor-phone">Phone</Label>
              <Input id="instructor-phone" name="phone" className="mt-2" placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="instructor-title">Professional title</Label>
              <Input id="instructor-title" name="professional_title" className="mt-2" placeholder="e.g. Network Instructor" />
            </div>
            <div>
              <Label htmlFor="instructor-qualifications">Qualifications</Label>
              <Input id="instructor-qualifications" name="qualifications" className="mt-2" placeholder="CCNA, BSc IT, ..." />
              <p className="mt-1 text-xs text-text-muted">Separate multiple items with commas.</p>
            </div>
            <div>
              <Label htmlFor="instructor-expertise">Expertise</Label>
              <Input id="instructor-expertise" name="expertise" className="mt-2" placeholder="Networking, Cyber Security, ..." />
              <p className="mt-1 text-xs text-text-muted">Separate multiple items with commas.</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="instructor-bio">Bio</Label>
              <textarea
                id="instructor-bio"
                name="bio"
                rows={3}
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="Short instructor biography"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary md:col-span-2">
              <input name="is_public" type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" />
              Show this instructor on the public instructors page
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending || readOnlyDemo}>
                <Mail className="mr-2 h-4 w-4" />
                {pending ? "Sending invitation..." : readOnlyDemo ? "Demo is read-only" : "Invite instructor"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {instructors.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 pt-12 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-3 font-semibold text-text-primary">No instructors yet</p>
              <p className="mt-1 text-sm text-text-secondary">Invite the first lecturer using the form above.</p>
            </CardContent>
          </Card>
        ) : (
          instructors.map((instructor) => (
            <Card key={instructor.id}>
              <CardContent className="p-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-text-primary">{instructor.full_name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{instructor.professional_title ?? "Instructor"}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <Mail className="h-3.5 w-3.5" /> {instructor.email ?? "No email"}
                    </p>
                  </div>
                  <Badge variant={instructor.status === "active" ? "success" : "secondary"}>
                    {instructor.status}
                  </Badge>
                </div>

                <div className="mt-5 rounded-md border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <Briefcase className="h-4 w-4 text-brand-primary" />
                      Assigned classes
                    </span>
                    <span className="text-sm font-bold text-brand-primary">{instructor.assigned_classes.length}</span>
                  </div>
                  {instructor.assigned_classes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {instructor.assigned_classes.slice(0, 3).map((classRow) => (
                        <div key={classRow.id} className="text-xs text-text-secondary">
                          <span className="font-semibold text-text-primary">{classRow.name}</span>
                          <span> · {classRow.course_title} · {classRow.intake_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={instructor.is_public ? "success" : "outline"}>
                    {instructor.is_public ? "Public profile" : "Private profile"}
                  </Badge>
                  {instructor.expertise.slice(0, 3).map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
