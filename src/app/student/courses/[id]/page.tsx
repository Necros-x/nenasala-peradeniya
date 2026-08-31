import CourseDetails from "@/features/student/pages/courses/CourseDetails";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentCourseById } from "@/lib/services/student-courses";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <CourseDetails />;

  const course = await getCurrentStudentCourseById(id);
  return <CourseDetails initialCourse={course} />;
}
