"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, ChevronLeft, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { registerStudentAction } from "@/lib/actions/admin/students";
import type { IntakeRecord } from "@/lib/services/intakes";

export default function StudentRegistration({
  intakes,
  accessKey,
  readOnlyDemo,
}: {
  intakes: IntakeRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ studentNumber: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    intakeId: "",
  });

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.set("accessKey", accessKey);
      payload.set("first_name", formData.firstName);
      payload.set("last_name", formData.lastName);
      payload.set("email", formData.email);
      payload.set("phone", formData.phone);
      payload.set("date_of_birth", formData.dateOfBirth);
      payload.set("address", formData.address);
      payload.set("intake_id", formData.intakeId);

      const response = await registerStudentAction(payload);
      if (!response.ok || !response.studentNumber || !response.email) {
        toast.error(response.error ?? "Unable to register student.");
        return;
      }

      setResult({ studentNumber: response.studentNumber, email: response.email });
      toast.success("Student registered and invitation sent");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="border-success/20 shadow-sm">
          <CardContent className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Student registered</h2>
            <p className="mb-8 max-w-md text-text-secondary">
              The learner has been enrolled and an invitation email was sent. They will set their own password; administrators never need to know it.
            </p>

            <div className="mb-8 w-full space-y-4 text-left">
              <div>
                <Label className="mb-1 block text-text-muted">Student Number</Label>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                  <span className="font-mono font-medium text-foreground">{result.studentNumber}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(result.studentNumber)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-text-muted">Invitation Email</Label>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                  <span className="font-medium text-foreground">{result.email}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(result.email)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted"><Mail className="h-3.5 w-3.5" /> The invite opens Nenasala&apos;s password setup page.</p>
              </div>
            </div>

            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setStep(1);
                  setFormData({ firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", address: "", intakeId: "" });
                }}
              >
                Register Another
              </Button>
              <Button className="flex-1" onClick={() => router.push(`/internal/${accessKey}/students`)}>View Directory</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/internal/${accessKey}/students`}>
          <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Student</h1>
          <p className="text-text-secondary">Step {step} of 2</p>
        </div>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only. Sign in with a real administrator account to register a student.
        </div>
      )}

      <div className="flex gap-2">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-brand-primary" : "bg-surface-muted"}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-brand-primary" : "bg-surface-muted"}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? "Student Information" : "Enrollment"}</CardTitle>
          <CardDescription>
            {step === 1 ? "Create the learner profile." : "Choose the intake that controls the student's class access."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={step === 1 ? (event) => { event.preventDefault(); setStep(2); } : handleSubmit}>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="first-name">First Name</Label><Input id="first-name" required value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="last-name">Last Name</Label><Input id="last-name" required value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="student-email">Email Address</Label><Input id="student-email" type="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="student-phone">Phone Number</Label><Input id="student-phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="student-dob">Date of Birth</Label><Input id="student-dob" type="date" value={formData.dateOfBirth} onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="student-address">Address</Label><Input id="student-address" value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} /></div>
                </div>
              </>
            ) : (
              <>
                {intakes.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                    <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>Create an intake before registering students. Enrollment is what determines which classes a student can access.</p></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="student-intake">Intake</Label>
                    <select
                      id="student-intake"
                      required
                      value={formData.intakeId}
                      onChange={(event) => setFormData({ ...formData, intakeId: event.target.value })}
                      className="flex h-10 w-full rounded-[var(--radius-sm)] border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
                    >
                      <option value="">Select intake</option>
                      {intakes.filter((intake) => !["completed", "closed"].includes(intake.status)).map((intake) => (
                        <option key={intake.id} value={intake.id}>{intake.programme_name} — {intake.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted">The learner automatically receives the classes attached to this intake.</p>
                  </div>
                )}

                <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted/50 p-4">
                  <p className="font-medium text-foreground">Secure account setup</p>
                  <p className="mt-1 text-sm text-text-secondary">Nenasala will send an invitation email. The student chooses their password privately; no temporary password is shown to administrators.</p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border p-6">
            {step === 1 ? (
              <>
                <Button type="button" variant="ghost" onClick={() => router.push(`/internal/${accessKey}/students`)}>Cancel</Button>
                <Button type="submit">Continue to Enrollment</Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" disabled={isSubmitting || readOnlyDemo || intakes.length === 0 || !formData.intakeId}>
                  {isSubmitting ? "Registering..." : "Register & Send Invite"}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
