import InstructorQuizzes from "@/features/instructor/pages/InstructorQuizzes";
import { getInstructorQuizzesData } from "@/lib/services/instructor-portal";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const data = await getInstructorQuizzesData();

  return (
    <InstructorQuizzes
      quizzes={data.quizzes}
      attempts={data.attempts}
      accessKey={accessKey}
    />
  );
}
