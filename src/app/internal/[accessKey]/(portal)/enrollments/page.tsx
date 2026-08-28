import EnrollmentsManager from "@/features/admin/pages/admin/EnrollmentsManager";
import { getAdminEnrollments } from "@/lib/services/students";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [enrollments, demo] = await Promise.all([getAdminEnrollments(), hasValidDemoSession()]);
  return <EnrollmentsManager enrollments={enrollments} accessKey={accessKey} readOnlyDemo={isAdminDemoEnabled() && demo} />;
}
