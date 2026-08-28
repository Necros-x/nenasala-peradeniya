import type { Metadata } from "next";
import { CourseDetailPage } from "@/features/public/pages/CourseDetailPage";
import { getPublicCourseBySlug } from "@/lib/services/courses";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  return {
    title: course?.title ?? "Course",
    description: course?.shortDescription || course?.description || undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  return <CourseDetailPage initialCourse={course} />;
}
