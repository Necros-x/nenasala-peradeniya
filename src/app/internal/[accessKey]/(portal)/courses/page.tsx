import CoursesList from "@/features/admin/pages/admin/CoursesList";
import { getAdminCourses } from "@/lib/services/courses";
import { getAdminProgrammes } from "@/lib/services/programmes";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [courses, programmes, hasDemoSession] = await Promise.all([
    getAdminCourses(),
    getAdminProgrammes(),
    hasValidDemoSession(),
  ]);

  return (
    <CoursesList
      initialCourses={courses}
      initialProgrammes={programmes}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && hasDemoSession}
    />
  );
}
