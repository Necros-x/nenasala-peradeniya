import CourseContentManager from "@/features/admin/pages/lms/CourseContentManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminCourseContent } from "@/lib/services/course-content";
import { getAdminCourses } from "@/lib/services/courses";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [courses, modules, demo] = await Promise.all([
    getAdminCourses(),
    getAdminCourseContent(),
    hasValidDemoSession(),
  ]);

  return (
    <CourseContentManager
      courses={courses}
      modules={modules}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
