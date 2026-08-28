import AssignmentsManager from "@/features/admin/pages/lms/AssignmentsManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminAssignments, getAdminAssignmentSubmissions } from "@/lib/services/assignments";
import { getAdminClasses } from "@/lib/services/classes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, assignments, submissions, demo] = await Promise.all([
    getAdminClasses(),
    getAdminAssignments(),
    getAdminAssignmentSubmissions(),
    hasValidDemoSession(),
  ]);

  return (
    <AssignmentsManager
      classes={classes}
      assignments={assignments}
      submissions={submissions}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
