import AssignmentsManager from "@/features/admin/pages/lms/AssignmentsManager";
import { getAdminAssignments, getAdminAssignmentSubmissions } from "@/lib/services/assignments";
import { getAdminClasses } from "@/lib/services/classes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, assignments, submissions] = await Promise.all([
    getAdminClasses(),
    getAdminAssignments(),
    getAdminAssignmentSubmissions(),
  ]);

  return (
    <AssignmentsManager
      classes={classes}
      assignments={assignments}
      submissions={submissions}
      accessKey={accessKey}
      readOnlyDemo={false}
    />
  );
}
