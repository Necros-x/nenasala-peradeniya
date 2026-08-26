"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Download, MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";

const MOCK_STUDENTS = [
  { id: "NPU-STU-202600041", name: "Ramika Perera", course: "Web Development", intake: "WD-26.2", date: "24 Aug 2026", status: "Active" },
  { id: "NPU-STU-202600042", name: "Sarah Silva", course: "Graphic Design", intake: "GD-26.1", date: "25 Aug 2026", status: "Pending Verification" },
  { id: "NPU-STU-202600043", name: "Kasun Bandara", course: "Data Science", intake: "DS-26.2", date: "25 Aug 2026", status: "Active" },
  { id: "NPU-STU-202600044", name: "Amila Fernando", course: "Web Development", intake: "WD-26.2", date: "26 Aug 2026", status: "Inactive" },
  { id: "NPU-STU-202600045", name: "Dinithi Jayasuriya", course: "English Spoken", intake: "EN-26.3", date: "26 Aug 2026", status: "Active" },
];

export default function StudentsList() {
  const [search, setSearch] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return <Badge variant="success">Active</Badge>;
      case "Pending Verification": return <Badge variant="warning">Pending</Badge>;
      case "Inactive": return <Badge variant="secondary">Inactive</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students Directory</h1>
          <p className="text-text-secondary">Manage student registrations, profiles, and enrollments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link to="/students/new">
            <Button>Register Student</Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-muted">Total Students</p>
            <h3 className="text-2xl font-bold mt-1">1,248</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-muted">Active</p>
            <h3 className="text-2xl font-bold mt-1 text-success">1,102</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-muted">Pending Verification</p>
            <h3 className="text-2xl font-bold mt-1 text-warning">15</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-muted">New This Month</p>
            <h3 className="text-2xl font-bold mt-1">42</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Registration ID</TableHead>
                <TableHead>Course / Programme</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_STUDENTS.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                  <TableCell className="text-text-secondary">{student.id}</TableCell>
                  <TableCell>{student.course}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.intake}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{student.date}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-danger"><Trash className="mr-2 h-4 w-4" /> Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-text-secondary">
            <span>Showing 1 to 5 of 1,248 entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
