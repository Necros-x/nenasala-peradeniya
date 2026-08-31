import { redirect } from "next/navigation";
import RealProfile from "@/features/student/pages/RealProfile";
import { requireStudent } from "@/lib/auth/guards";
import { getCurrentStudentAccountProfile } from "@/lib/services/account-profile";

export default async function Page() {
  await requireStudent();
  const profile = await getCurrentStudentAccountProfile();
  if (!profile) redirect("/student/settings");
  return <RealProfile profile={profile} />;
}
