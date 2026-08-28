import RecordingsManager from "@/features/admin/pages/lms/RecordingsManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminClasses } from "@/lib/services/classes";
import { getAdminCourses } from "@/lib/services/courses";
import {
  getAdminLiveSessions,
  getAdminRecordingAssignments,
  getAdminRecordings,
} from "@/lib/services/media";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, courses, sessions, recordings, assignments, demo] = await Promise.all([
    getAdminClasses(),
    getAdminCourses(),
    getAdminLiveSessions(),
    getAdminRecordings(),
    getAdminRecordingAssignments(),
    hasValidDemoSession(),
  ]);

  return (
    <RecordingsManager
      classes={classes}
      courses={courses}
      sessions={sessions}
      recordings={recordings}
      assignments={assignments}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
