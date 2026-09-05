"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, GraduationCap, Search, UserPlus } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { AdminStudentRecord } from "@/lib/services/students";

function enrollmentBadge(status: AdminStudentRecord["enrollment_status"]) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "pending") return <Badge variant="warning">Pending</Badge>;
  if (status === "paused") return <Badge variant="warning">Paused</Badge>;
  if (status === "completed") return <Badge variant="info">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="danger">Cancelled</Badge>;
  return <Badge variant="secondary">Not enrolled</Badge>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

type Props = {
  students: AdminStudentRecord[];
  accessKey: string;
};

export default function StudentsList({ students, accessKey }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [
        student.full_name,
        student.student_number,
        student.email ?? "",
        student.phone ?? "",
        student.intake_name ?? "",
        student.programme_name ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, students]);

  const active = students.filter((student) => student.enrollment_status === "active").length;
  const pending = students.filter((student) => student.enrollment_status === "pending").length;
  const thisMonth = students.filter((student) => {
    const joined = new Date(`${student.joined_at}T00:00:00`);
    const now = new Date();
    return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students Directory</h1>
          <p className="text-text-secondary">Real student accounts and intake enrollments from Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="hidden sm:flex" disabled>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Link href={`/internal/${accessKey}/enrollments`}>
            <Button variant="outline">
              <GraduationCap className="mr-2 h-4 w-4" /> Enrollments
            </Button>
          </Link>
          <Link href={`/internal/${accessKey}/students/new`}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Register Student
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-text-muted">Total Students</p><h3 className="mt-1 text-2xl font-bold">{students.length}</h3></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-text-muted">Active Enrollments</p><h3 className="mt-1 text-2xl font-bold text-success">{active}</h3></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-text-muted">Pending</p><h3 className="mt-1 text-2xl font-bold text-warning">{pending}</h3></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-text-muted">New This Month</p><h3 className="mt-1 text-2xl font-bold">{thisMonth}</h3></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search name, student number, email or intake..."
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-foreground">{students.length === 0 ? "No students registered yet" : "No matching students"}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {students.length === 0 ? "Register the first learner once an intake is ready." : "Try another search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Intake</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{student.full_name}</p>
                          <p className="text-xs text-text-muted">{student.email ?? "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-secondary">{student.student_number}</TableCell>
                      <TableCell>{student.programme_name ?? "—"}</TableCell>
                      <TableCell>{student.intake_name ? <Badge variant="outline">{student.intake_name}</Badge> : "—"}</TableCell>
                      <TableCell className="text-text-secondary">{formatDate(student.enrolled_at ?? student.joined_at)}</TableCell>
                      <TableCell>{enrollmentBadge(student.enrollment_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-text-secondary">
            <span>{filtered.length} of {students.length} students</span>
            <span>Live database</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
