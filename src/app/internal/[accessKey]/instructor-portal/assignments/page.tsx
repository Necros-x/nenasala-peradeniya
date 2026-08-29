import InstructorAssignments from "@/features/instructor/pages/InstructorAssignments";
import { getInstructorAssignmentsData } from "@/lib/services/instructor-portal";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const data = await getInstructorAssignmentsData();

  return (
    <InstructorAssignments
      assignments={data.assignments}
      submissions={data.submissions}
      accessKey={accessKey}
    />
  );
}
