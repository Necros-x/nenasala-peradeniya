import { redirect } from "next/navigation";
import InternalProfile from "@/features/admin/pages/admin/InternalProfile";
import { requireAdministrationAccess } from "@/lib/auth/guards";
import { getCurrentAccountProfile } from "@/lib/services/account-profile";
import type { AccountRole } from "@/lib/types/account";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireAdministrationAccess(`/internal/${accessKey}/login`);
  const profile = await getCurrentAccountProfile(identity.roles as AccountRole[]);
  if (!profile) redirect(`/internal/${accessKey}`);
  return <InternalProfile profile={profile} />;
}
