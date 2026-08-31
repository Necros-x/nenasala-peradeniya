import Notifications from "@/features/student/pages/Notifications";
import RealNotifications from "@/features/student/pages/RealNotifications";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentAssignments } from "@/lib/services/assignments";
import { getCurrentStudentNotifications } from "@/lib/services/notifications";
import { getCurrentStudentQuizzes } from "@/lib/services/quizzes";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <Notifications />;

  // Backfill idempotent notifications for scheduled content that has become visible.
  await Promise.all([
    getCurrentStudentAssignments(),
    getCurrentStudentQuizzes(),
  ]);
  const notifications = await getCurrentStudentNotifications();
  return <RealNotifications initialNotifications={notifications} />;
}
