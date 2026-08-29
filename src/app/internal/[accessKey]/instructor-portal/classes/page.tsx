import InstructorClasses from "@/features/instructor/pages/InstructorClasses";
import { getInstructorClasses, getInstructorStudents } from "@/lib/services/instructor-portal";

export default async function Page() {
  const [classes, students] = await Promise.all([
    getInstructorClasses(),
    getInstructorStudents(),
  ]);

  return <InstructorClasses classes={classes} students={students} />;
}
