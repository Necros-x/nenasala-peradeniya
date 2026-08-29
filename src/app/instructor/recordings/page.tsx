import InstructorRecordings from "@/features/instructor/pages/InstructorRecordings";
import { getInstructorMediaData } from "@/lib/services/instructor-portal";

export default async function Page() {
  const data = await getInstructorMediaData();
  return <InstructorRecordings sessions={data.sessions} recordings={data.recordings} assignments={data.assignments} />;
}
