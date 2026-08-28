import { HomePage } from "@/features/public/pages/HomePage";
import { getPublicCourses } from "@/lib/services/courses";

export default async function Page() {
  const featuredCourses = await getPublicCourses(3);
  return <HomePage featuredCourses={featuredCourses} />;
}
