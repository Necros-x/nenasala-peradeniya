import Notifications from "@/features/student/pages/Notifications";
import RealNotifications from "@/features/student/pages/RealNotifications";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentAssignments } from "@/lib/services/assignments";
import { getCurrentStudentNotifications } from "@/lib/services/notifications";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([
    hasRealStudentSession(),
    hasValidDemoSession(),
  ]);

  if (!realStudent && (demo || localPreview)) return <Notifications />;

  // This also backfills idempotent publication notifications for assignments
  // that became visible through a scheduled publish time.
  await getCurrentStudentAssignments();
  const notifications = await getCurrentStudentNotifications();
  return <RealNotifications initialNotifications={notifications} />;
}
