import QuizSession from "@/features/student/pages/quizzes/QuizSession";
import RealQuizSession from "@/features/student/pages/quizzes/RealQuizSession";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentQuizSession } from "@/lib/services/quizzes";

export default async function Page({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <QuizSession />;

  const data = await getCurrentStudentQuizSession(quizId);
  return <RealQuizSession initialData={data} />;
}
