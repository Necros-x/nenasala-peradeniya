import QuizzesManager from "@/features/admin/pages/lms/QuizzesManager";
import { getAdminClasses } from "@/lib/services/classes";
import { getAdminQuizAttempts, getAdminQuizQuestions, getAdminQuizzes } from "@/lib/services/quizzes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [classes, quizzes, questions, attempts] = await Promise.all([
    getAdminClasses(),
    getAdminQuizzes(),
    getAdminQuizQuestions(),
    getAdminQuizAttempts(),
  ]);

  return (
    <QuizzesManager
      classes={classes}
      quizzes={quizzes}
      questions={questions}
      attempts={attempts}
      accessKey={accessKey}
      readOnlyDemo={false}
    />
  );
}
