import Quizzes from "@/features/student/pages/quizzes/Quizzes";
import RealQuizzes from "@/features/student/pages/quizzes/RealQuizzes";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentQuizzes } from "@/lib/services/quizzes";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <Quizzes />;

  const quizzes = await getCurrentStudentQuizzes();
  return <RealQuizzes quizzes={quizzes} />;
}
