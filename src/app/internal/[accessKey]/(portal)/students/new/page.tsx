import StudentRegistration from "@/features/admin/pages/admin/StudentRegistration";
import { getAdminIntakes } from "@/lib/services/intakes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const intakes = await getAdminIntakes();
  return <StudentRegistration intakes={intakes} accessKey={accessKey} readOnlyDemo={false} />;
}
