import LessonView from "@/features/student/pages/courses/LessonView";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentLesson } from "@/lib/services/student-courses";

export default async function Page({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([
    hasRealStudentSession(),
    hasValidDemoSession(),
  ]);

  if (!realStudent && (demo || localPreview)) return <LessonView />;

  const data = await getCurrentStudentLesson(id, lessonId);
  return <LessonView initialCourse={data?.course ?? null} initialLesson={data?.lesson ?? null} />;
}
