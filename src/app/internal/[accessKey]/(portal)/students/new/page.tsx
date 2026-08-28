import StudentRegistration from "@/features/admin/pages/admin/StudentRegistration";
import { getAdminIntakes } from "@/lib/services/intakes";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [intakes, demo] = await Promise.all([getAdminIntakes(), hasValidDemoSession()]);
  return <StudentRegistration intakes={intakes} accessKey={accessKey} readOnlyDemo={isAdminDemoEnabled() && demo} />;
}
