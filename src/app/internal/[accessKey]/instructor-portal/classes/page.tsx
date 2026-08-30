import InstructorClassesManager from "@/features/instructor/pages/InstructorClassesManager";
import { getInstructorTeachingData } from "@/lib/services/instructor-teaching";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const data = await getInstructorTeachingData();
  if (!data) return null;
  return <InstructorClassesManager data={data} accessKey={accessKey} />;
}
