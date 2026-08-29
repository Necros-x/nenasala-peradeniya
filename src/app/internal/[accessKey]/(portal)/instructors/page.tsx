import InstructorsManager from "@/features/admin/pages/admin/InstructorsManager";
import { getAdminInstructors } from "@/lib/services/instructors";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [instructors, demo] = await Promise.all([
    getAdminInstructors(),
    hasValidDemoSession(),
  ]);
  return <InstructorsManager instructors={instructors} accessKey={accessKey} readOnlyDemo={isAdminDemoEnabled() && demo} />;
}
