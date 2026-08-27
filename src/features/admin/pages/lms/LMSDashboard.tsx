"use client";

import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/features/admin/components/ui/card";
import { Button } from "@/features/admin/components/ui/button";
import { Badge } from "@/features/admin/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/admin/components/ui/table";

export default function LMSDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
            LMS Management
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">LMS Overview</h1>
          <p className="text-text-secondary">
            Manage learning operations, classes, content, assignments and performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">New Announcement</Button>
          <Button>Schedule Class</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text-muted">Active Classes</p>
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-success-soft)] p-2 text-success">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">12</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text-muted">Pending Assignments</p>
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-warning-soft)] p-2 text-warning">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">48</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">Needs grading</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text-muted">Recent Recordings</p>
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-info-soft)] p-2 text-info">
                <PlayCircle className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground">5</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">Unpublished</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text-muted">Certificates Issued</p>
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] p-2 text-brand-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">156</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Scheduled sessions for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Instructor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { title: "React State Management", time: "Today, 14:00", inst: "N. Perera", status: "Online" },
                  { title: "Graphic Design Intro", time: "Tomorrow, 09:00", inst: "S. Silva", status: "In-house" },
                  { title: "Node.js Basics", time: "28 Aug, 13:00", inst: "R. Fernando", status: "Online" },
                  { title: "Database Normalization", time: "29 Aug, 10:00", inst: "N. Perera", status: "Online" },
                ].map((course) => (
                  <TableRow key={`${course.title}-${course.time}`}>
                    <TableCell>
                      <div className="font-medium text-foreground">{course.title}</div>
                      <Badge variant="outline" className="mt-1 h-4 text-[10px] leading-none">
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">{course.time}</TableCell>
                    <TableCell className="text-text-secondary">{course.inst}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Grading</CardTitle>
            <CardDescription>Recent assignment submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Build a Portfolio Site", course: "Web Development", count: 12, due: "Yesterday" },
                { title: "Logo Redesign", course: "Graphic Design", count: 8, due: "Today" },
                { title: "Data Cleaning Exercise", course: "Data Science", count: 28, due: "2 days ago" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 transition-colors hover:border-brand-primary/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-warning-soft)] text-warning">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium text-foreground">{item.title}</h4>
                      <p className="truncate text-xs text-text-muted">
                        {item.course} • Due {item.due}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div className="text-center">
                      <span className="block text-lg font-bold leading-none text-foreground">{item.count}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Pending</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
