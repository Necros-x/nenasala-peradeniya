import InstructorDashboard from "@/features/instructor/pages/InstructorDashboard";
import { getInstructorDashboardData } from "@/lib/services/instructor-portal";

export default async function Page() {
  const data = await getInstructorDashboardData();
  return <InstructorDashboard data={data} />;
}
