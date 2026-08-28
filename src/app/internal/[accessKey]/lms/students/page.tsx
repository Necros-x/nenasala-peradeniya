import StudentsList from "@/features/admin/pages/admin/StudentsList";
import { getAdminStudents } from "@/lib/services/students";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [students, demo] = await Promise.all([getAdminStudents(), hasValidDemoSession()]);
  return <StudentsList students={students} accessKey={accessKey} readOnlyDemo={isAdminDemoEnabled() && demo} />;
}
