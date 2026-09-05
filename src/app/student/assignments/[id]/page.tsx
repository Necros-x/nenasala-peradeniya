import AssignmentDetails from "@/features/student/pages/assignments/AssignmentDetails";
import RealAssignmentDetails from "@/features/student/pages/assignments/RealAssignmentDetails";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentAssignment } from "@/lib/services/assignments";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([hasRealStudentSession()]);
  if (!realStudent && (localPreview)) return <AssignmentDetails />;

  const assignment = await getCurrentStudentAssignment(id);
  return <RealAssignmentDetails assignment={assignment} />;
}
