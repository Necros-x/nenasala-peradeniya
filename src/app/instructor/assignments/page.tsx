import InstructorAssignments from "@/features/instructor/pages/InstructorAssignments";
import { getInstructorAssignmentsData } from "@/lib/services/instructor-portal";

export default async function Page() {
  const data = await getInstructorAssignmentsData();
  return <InstructorAssignments assignments={data.assignments} submissions={data.submissions} />;
}
