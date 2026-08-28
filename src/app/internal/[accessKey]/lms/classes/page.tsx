import ClassesManager from "@/features/admin/pages/lms/ClassesManager";
import { getAdminClasses, getAdminInstructorOptions } from "@/lib/services/classes";
import { getAdminCourses } from "@/lib/services/courses";
import { getAdminIntakes } from "@/lib/services/intakes";
import { getAdminProgrammes } from "@/lib/services/programmes";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, intakes, programmes, courses, instructors, demo] = await Promise.all([
    getAdminClasses(),
    getAdminIntakes(),
    getAdminProgrammes(),
    getAdminCourses(),
    getAdminInstructorOptions(),
    hasValidDemoSession(),
  ]);

  return (
    <ClassesManager
      classes={classes}
      intakes={intakes}
      programmes={programmes}
      courses={courses}
      instructors={instructors}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
