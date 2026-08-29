import InstructorPortalHub from "@/features/admin/pages/admin/InstructorPortalHub";
import { getAdminInstructors } from "@/lib/services/instructors";

export default async function Page() {
  const instructors = await getAdminInstructors();

  return <InstructorPortalHub instructors={instructors} />;
}
