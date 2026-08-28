import ProgressOverview from "@/features/admin/pages/lms/ProgressOverview";
import { getAdminStudentProgress } from "@/lib/services/progress";

export default async function Page() {
  const rows = await getAdminStudentProgress();
  return <ProgressOverview rows={rows} />;
}
