import InstructorsManager from "@/features/admin/pages/admin/InstructorsManager";
import { getAdminInstructors } from "@/lib/services/instructors";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const instructors = await getAdminInstructors();
  return <InstructorsManager instructors={instructors} accessKey={accessKey} readOnlyDemo={false} />;
}
