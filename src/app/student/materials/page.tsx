import StudentMaterials from "@/features/student/pages/StudentMaterials";
import { getStudentCourseMaterials } from "@/lib/services/instructor-teaching";

export default async function Page() {
  const data = await getStudentCourseMaterials();
  return <StudentMaterials courses={data.courses} materials={data.materials} />;
}
