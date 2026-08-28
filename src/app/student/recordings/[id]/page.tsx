import RecordingView from "@/features/student/pages/recordings/RecordingView";
import { getCurrentStudentRecording } from "@/lib/services/student-media";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recording = await getCurrentStudentRecording(id);
  return <RecordingView recording={recording} />;
}
