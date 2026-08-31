import StudentsList from "@/features/admin/pages/admin/StudentsList";
import { getAdminStudents } from "@/lib/services/students"

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const students = await getAdminStudents();
  return <StudentsList students={students} accessKey={accessKey} />;
}
