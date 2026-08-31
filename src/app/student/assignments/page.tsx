import Assignments from "@/features/student/pages/assignments/Assignments";
import RealAssignments from "@/features/student/pages/assignments/RealAssignments";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentAssignments } from "@/lib/services/assignments";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([hasRealStudentSession()]);
  if (!realStudent && (localPreview)) return <Assignments />;

  const assignments = await getCurrentStudentAssignments();
  return <RealAssignments assignments={assignments} />;
}
