import InstructorContent from "@/features/instructor/pages/InstructorContent";
import { getInstructorContent } from "@/lib/services/instructor-portal";

export default async function Page() {
  return <InstructorContent courses={await getInstructorContent()} />;
}
