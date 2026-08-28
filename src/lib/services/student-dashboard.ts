import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentAssessmentSummary, type StudentAssessmentResult } from "@/lib/services/student-assessments";
import { getCurrentStudentCourses } from "@/lib/services/student-courses";
import { getCurrentStudentRecordings, getCurrentStudentSchedule } from "@/lib/services/student-media";
import type { CalendarEvent, Course } from "@/features/student/types";

export type StudentDashboardData = {
  studentName: string;
  courses: Course[];
  upcomingEvents: CalendarEvent[];
  recentResults: StudentAssessmentResult[];
  completedLessons: number;
  totalLessons: number;
  completedRecordings: number;
  assignmentsGraded: number;
  assignmentsSubmitted: number;
  quizAttemptsCompleted: number;
  quizzesPassed: number;
};

function emptyDashboard(): StudentDashboardData {
  return {
    studentName: "Student",
    courses: [],
    upcomingEvents: [],
    recentResults: [],
    completedLessons: 0,
    totalLessons: 0,
    completedRecordings: 0,
    assignmentsGraded: 0,
    assignmentsSubmitted: 0,
    quizAttemptsCompleted: 0,
    quizzesPassed: 0,
  };
}

export async function getCurrentStudentDashboard(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  if (!supabase) return emptyDashboard();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return emptyDashboard();

  const [profileResult, courses, schedule, recordings, assessments] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle(),
    getCurrentStudentCourses(),
    getCurrentStudentSchedule(),
    getCurrentStudentRecordings(),
    getCurrentStudentAssessmentSummary(),
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
  const actionableAssignments = assessments.assignmentEvents.filter(
    (event) => event.assignmentState !== "submitted" && event.assignmentState !== "graded"
  );
  const actionableQuizzes = assessments.quizEvents.filter(
    (event) => event.quizState !== "passed" && event.quizState !== "failed"
  );
  const upcomingEvents = [...liveUpcoming, ...actionableAssignments, ...actionableQuizzes]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return {
    studentName: profileResult.data?.full_name?.trim() || "Student",
    courses,
    upcomingEvents,
    recentResults: assessments.recentResults,
    completedLessons,
    totalLessons,
    completedRecordings,
    assignmentsGraded: assessments.assignmentsGraded,
    assignmentsSubmitted: assessments.assignmentsSubmitted,
    quizAttemptsCompleted: assessments.quizAttemptsCompleted,
    quizzesPassed: assessments.quizzesPassed,
  };
}
