import type { Metadata } from "next";
import { requireInstructorPortal } from "@/lib/auth/guards";
import { getCurrentInstructorProfile } from "@/lib/services/instructor-portal";
import InstructorShell from "@/components/instructor/InstructorShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const identity = await requireInstructorPortal(`/internal/${accessKey}/login`);

  const globalView = identity.roles.includes("super_admin");
  const loadedProfile = await getCurrentInstructorProfile();
  const profile = loadedProfile ?? {
    id: identity.id,
    full_name: globalView ? "Super Administrator" : "Instructor",
    email: null,
    avatar_url: null,
    professional_title: globalView ? "Super Administrator" : "Instructor",
  };

  const basePath = `/internal/${accessKey}/instructor-portal`;

  return (
    <InstructorShell
      profile={profile}
      basePath={basePath}
      loginPath={`/internal/${accessKey}/login`}
      controlCenterPath={`/internal/${accessKey}`}
      globalView={globalView}
    >
      {children}
    </InstructorShell>
  );
}
