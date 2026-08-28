import type { Metadata } from "next";
import { CoursesPage } from "@/features/public/pages/CoursesPage";
import { getPublicCourses } from "@/lib/services/courses";

export const metadata: Metadata = { title: "Courses" };

export default async function Page() {
  const courses = await getPublicCourses();
  return <CoursesPage initialCourses={courses} />;
}
