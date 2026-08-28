import QuizzesManager from "@/features/admin/pages/lms/QuizzesManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminClasses } from "@/lib/services/classes";
import { getAdminQuizAttempts, getAdminQuizQuestions, getAdminQuizzes } from "@/lib/services/quizzes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, quizzes, questions, attempts, demo] = await Promise.all([
    getAdminClasses(),
    getAdminQuizzes(),
    getAdminQuizQuestions(),
    getAdminQuizAttempts(),
    hasValidDemoSession(),
  ]);

  return (
    <QuizzesManager
      classes={classes}
      quizzes={quizzes}
      questions={questions}
      attempts={attempts}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
