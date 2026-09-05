import MyCourses from "@/features/student/pages/courses/MyCourses";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentCourses } from "@/lib/services/student-courses";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession(),
  ]);

  if (!realStudent && (localPreview)) return <MyCourses />;

  const courses = await getCurrentStudentCourses();
  return <MyCourses initialCourses={courses} />;
}
