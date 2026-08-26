"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MoreHorizontal, LayoutGrid, List as ListIcon, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

const MOCK_COURSES = [
  { id: "WD-101", title: "Web Development Bootcamp", programme: "Diploma in Software Engineering", students: 142, intakes: 3, status: "Published", mode: "Hybrid" },
  { id: "GD-201", title: "Graphic Design Masterclass", programme: "Certificate in Design", students: 86, intakes: 2, status: "Published", mode: "Online" },
  { id: "DS-301", title: "Data Science Fundamentals", programme: "Diploma in Data Science", students: 45, intakes: 1, status: "Draft", mode: "In-house" },
  { id: "EN-101", title: "Spoken English", programme: "Language Studies", students: 210, intakes: 5, status: "Published", mode: "Online" },
];

export default function CoursesList() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Programmes & Courses</h1>
          <p className="text-text-secondary">Manage academic offerings and course content.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">New Programme</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> New Course</Button>
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="programmes">Programmes</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <Input placeholder="Search courses..." className="pl-9 bg-surface" />
            </div>
            <Button variant="outline" size="icon" onClick={() => setView(view === "grid" ? "list" : "grid")}>
              {view === "grid" ? <ListIcon className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <TabsContent value="courses" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_COURSES.map(course => (
              <Card key={course.id} className="flex flex-col hover:border-brand-primary/30 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <Badge variant={course.status === "Published" ? "success" : "secondary"}>
                      {course.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Manage Content</DropdownMenuItem>
                        <DropdownMenuItem>View Intakes</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="leading-tight">{course.title}</CardTitle>
                  <CardDescription className="text-xs">{course.id} • {course.programme}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted text-xs mb-1">Students</p>
                      <p className="font-medium text-foreground">{course.students}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Intakes</p>
                      <p className="font-medium text-foreground">{course.intakes}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Mode</p>
                      <p className="font-medium text-foreground">{course.mode}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full text-brand-primary">
                    Manage Course
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="programmes">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-text-muted">Programme management interface would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
