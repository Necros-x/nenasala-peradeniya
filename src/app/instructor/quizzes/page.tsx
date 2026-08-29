import InstructorQuizzes from "@/features/instructor/pages/InstructorQuizzes";
import { getInstructorQuizzesData } from "@/lib/services/instructor-portal";

export default async function Page() {
  const data = await getInstructorQuizzesData();
  return <InstructorQuizzes quizzes={data.quizzes} attempts={data.attempts} />;
}
