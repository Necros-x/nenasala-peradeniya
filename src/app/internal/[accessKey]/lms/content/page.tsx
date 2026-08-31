import CourseContentManager from "@/features/admin/pages/lms/CourseContentManager";
import { getAdminCourseContent } from "@/lib/services/course-content";
import { getAdminCourses } from "@/lib/services/courses";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [courses, modules] = await Promise.all([
    getAdminCourses(),
    getAdminCourseContent(),
  ]);

  return (
    <CourseContentManager
      courses={courses}
      modules={modules}
      accessKey={accessKey}
      readOnlyDemo={false}
    />
  );
}
