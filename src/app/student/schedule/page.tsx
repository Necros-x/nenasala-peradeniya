import Schedule from "@/features/student/pages/Schedule";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentAssessmentSummary } from "@/lib/services/student-assessments";
import { getCurrentStudentSchedule } from "@/lib/services/student-media";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession(),
  ]);

  if (!realStudent && (localPreview)) return <Schedule />;

  const [liveEvents, assessments] = await Promise.all([
    getCurrentStudentSchedule(),
    getCurrentStudentAssessmentSummary(),
  ]);
  const events = [...liveEvents, ...assessments.assignmentEvents, ...assessments.quizEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return <Schedule initialEvents={events} />;
}
