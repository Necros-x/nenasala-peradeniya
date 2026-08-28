"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { updateEnrollmentStatusAction } from "@/lib/actions/admin/students";
import type { AdminEnrollmentRecord } from "@/lib/services/students";

const statuses: AdminEnrollmentRecord["status"][] = ["pending", "active", "paused", "completed", "cancelled"];

function statusVariant(status: AdminEnrollmentRecord["status"]): "warning" | "success" | "info" | "outline" | "danger" {
  if (status === "active") return "success";
  if (status === "pending" || status === "paused") return "warning";
  if (status === "completed") return "info";
  if (status === "cancelled") return "danger";
  return "outline";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function EnrollmentsManager({
  enrollments,
  accessKey,
  readOnlyDemo,
}: {
  enrollments: AdminEnrollmentRecord[];
  accessKey: string;
  readOnlyDemo: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrollments;
    return enrollments.filter((item) =>
      [item.student_name, item.student_number, item.intake_name, item.programme_name].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [enrollments, search]);

  async function changeStatus(item: AdminEnrollmentRecord, status: AdminEnrollmentRecord["status"]) {
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");
    if (status === item.status) return;

    setSavingId(item.id);
    try {
      const formData = new FormData();
      formData.set("accessKey", accessKey);
      formData.set("enrollment_id", item.id);
      formData.set("status", status);
      const result = await updateEnrollmentStatusAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to update enrollment.");
      toast.success("Enrollment updated");
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Enrollments</h1>
        <p className="mt-1 text-text-secondary">Control each student&apos;s intake membership and LMS access state.</p>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only. Enrollment status changes require a real administrator session.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, programme or intake..." className="pl-9" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-foreground">{enrollments.length === 0 ? "No enrollments yet" : "No matching enrollments"}</p>
              <p className="mt-1 text-sm text-text-secondary">Enrollments are created automatically when administrators register students.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Intake</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{item.student_name}</p>
                        <p className="font-mono text-xs text-text-muted">{item.student_number}</p>
                      </TableCell>
                      <TableCell>{item.programme_name}</TableCell>
                      <TableCell>{item.intake_name}</TableCell>
                      <TableCell className="text-text-secondary">{formatDate(item.enrolled_at)}</TableCell>
                      <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
                      <TableCell>
                        <select
                          value={item.status}
                          disabled={readOnlyDemo || savingId === item.id}
                          onChange={(event) => changeStatus(item, event.target.value as AdminEnrollmentRecord["status"])}
                          className="h-9 rounded-[var(--radius-sm)] border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50"
                        >
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
