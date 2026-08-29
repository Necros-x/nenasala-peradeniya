import InstructorProgress from "@/features/instructor/pages/InstructorProgress";
import { getInstructorProgress } from "@/lib/services/instructor-portal";

export default async function Page() {
  return <InstructorProgress rows={await getInstructorProgress()} />;
}
