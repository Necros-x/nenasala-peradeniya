import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentAssignmentEvents } from "@/lib/services/assignments";
import { getCurrentStudentCourses } from "@/lib/services/student-courses";
import { getCurrentStudentRecordings, getCurrentStudentSchedule } from "@/lib/services/student-media";
import type { CalendarEvent, Course } from "@/features/student/types";

export type StudentDashboardData = {
  studentName: string;
  courses: Course[];
  upcomingEvents: CalendarEvent[];
  completedLessons: number;
  totalLessons: number;
  completedRecordings: number;
};

export async function getCurrentStudentDashboard(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      studentName: "Student",
      courses: [],
      upcomingEvents: [],
      completedLessons: 0,
      totalLessons: 0,
      completedRecordings: 0,
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      studentName: "Student",
      courses: [],
      upcomingEvents: [],
      completedLessons: 0,
      totalLessons: 0,
      completedRecordings: 0,
    };
  }

  const [profileResult, courses, schedule, recordings, assignmentEvents] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle(),
    getCurrentStudentCourses(),
    getCurrentStudentSchedule(),
    getCurrentStudentRecordings(),
    getCurrentStudentAssignmentEvents(),
  ]);

  if (profileResult.error) {
    console.error("Unable to load student dashboard profile:", profileResult.error.message);
  }

  const completedLessons = courses.reduce((total, course) => total + (course.completedLessons ?? 0), 0);
  const totalLessons = courses.reduce((total, course) => total + course.totalLessons, 0);
  const completedRecordings = recordings.filter((recording) => recording.completed).length;
  const now = Date.now();
  const liveUpcoming = schedule.filter(
    (event) => new Date(event.date).getTime() >= now || event.status === "live"
  );
  const actionableAssignments = assignmentEvents.filter(
    (event) => event.assignmentState !== "submitted" && event.assignmentState !== "graded"
  );
  const upcomingEvents = [...liveUpcoming, ...actionableAssignments]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return {
    studentName: profileResult.data?.full_name?.trim() || "Student",
    courses,
    upcomingEvents,
    completedLessons,
    totalLessons,
    completedRecordings,
  };
}
