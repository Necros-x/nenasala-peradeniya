import EnrollmentsManager from "@/features/admin/pages/admin/EnrollmentsManager";
import { getAdminEnrollments } from "@/lib/services/students";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const enrollments = await getAdminEnrollments();
  return <EnrollmentsManager enrollments={enrollments} accessKey={accessKey} readOnlyDemo={false} />;
}
