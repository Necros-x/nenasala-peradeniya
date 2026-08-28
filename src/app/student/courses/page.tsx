import MyCourses from "@/features/student/pages/courses/MyCourses";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentCourses } from "@/lib/services/student-courses";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const demo = await hasValidDemoSession();

  if (demo || localPreview) return <MyCourses />;

  const courses = await getCurrentStudentCourses();
  return <MyCourses initialCourses={courses} />;
}
