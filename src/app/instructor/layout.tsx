import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireInstructor } from "@/lib/auth/guards";
import { getCurrentInstructorProfile } from "@/lib/services/instructor-portal";
import InstructorShell from "@/components/instructor/InstructorShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireInstructor();
  const profile = await getCurrentInstructorProfile();
  if (!profile) redirect("/");
  return <InstructorShell profile={profile}>{children}</InstructorShell>;
}
