import InstructorDashboard from "@/features/instructor/pages/InstructorDashboard";
import { getInstructorDashboardData } from "@/lib/services/instructor-portal";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const data = await getInstructorDashboardData();

  return (
    <InstructorDashboard
      data={data}
      basePath={`/internal/${accessKey}/instructor-portal`}
    />
  );
}
