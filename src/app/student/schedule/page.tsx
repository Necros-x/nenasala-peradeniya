import Schedule from "@/features/student/pages/Schedule";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentAssignmentEvents } from "@/lib/services/assignments";
import { getCurrentStudentSchedule } from "@/lib/services/student-media";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([
    hasRealStudentSession(),
    hasValidDemoSession(),
  ]);

  if (!realStudent && (demo || localPreview)) return <Schedule />;

  const [liveEvents, assignmentEvents] = await Promise.all([
    getCurrentStudentSchedule(),
    getCurrentStudentAssignmentEvents(),
  ]);
  const events = [...liveEvents, ...assignmentEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return <Schedule initialEvents={events} />;
}
