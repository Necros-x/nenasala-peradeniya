import Quizzes from "@/features/student/pages/quizzes/Quizzes";
import RealQuizzes from "@/features/student/pages/quizzes/RealQuizzes";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentQuizzes } from "@/lib/services/quizzes";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([
    hasRealStudentSession(),
    hasValidDemoSession(),
  ]);

  if (!realStudent && (demo || localPreview)) return <Quizzes />;

  const quizzes = await getCurrentStudentQuizzes();
  return <RealQuizzes quizzes={quizzes} />;
}
