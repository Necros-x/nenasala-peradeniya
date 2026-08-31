import StudentRecordings from "@/features/student/pages/recordings/StudentRecordings";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentRecordings } from "@/lib/services/student-media";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) {
    return <StudentRecordings recordings={[]} />;
  }

  const recordings = await getCurrentStudentRecordings();
  return <StudentRecordings recordings={recordings} />;
}
