import QuizSession from "@/features/student/pages/quizzes/QuizSession";
import RealQuizSession from "@/features/student/pages/quizzes/RealQuizSession";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentQuizSession } from "@/lib/services/quizzes";

export default async function Page({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([
    hasRealStudentSession(),
    hasValidDemoSession(),
  ]);

  if (!realStudent && (demo || localPreview)) return <QuizSession />;

  const data = await getCurrentStudentQuizSession(quizId);
  return <RealQuizSession initialData={data} />;
}
