import CoursesList from "@/features/admin/pages/admin/CoursesList";
import { getAdminCourses } from "@/lib/services/courses";
import { getAdminProgrammes } from "@/lib/services/programmes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [courses, programmes] = await Promise.all([
    getAdminCourses(),
    getAdminProgrammes(),
  ]);

  return (
    <CoursesList
      initialCourses={courses}
      initialProgrammes={programmes}
      accessKey={accessKey}
    />
  );
}
