import { redirect } from "next/navigation";
import InternalProfile from "@/features/admin/pages/admin/InternalProfile";
import { requireInstructorPortal } from "@/lib/auth/guards";
import { getCurrentAccountProfile } from "@/lib/services/account-profile";
import type { AccountRole } from "@/lib/types/account";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireInstructorPortal(`/internal/${accessKey}/login`);
  const profile = await getCurrentAccountProfile(identity.roles as AccountRole[]);

  if (!profile) redirect(`/internal/${accessKey}/instructor-portal/dashboard`);
  return <InternalProfile profile={profile} />;
}
