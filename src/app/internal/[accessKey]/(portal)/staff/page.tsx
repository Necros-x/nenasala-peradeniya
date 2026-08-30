import InternalUsersManager from "@/features/admin/pages/admin/InternalUsersManager";
import { requireAdmin } from "@/lib/auth/guards";
import { getInternalUsers } from "@/lib/services/internal-users";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const identity = await requireAdmin(`/internal/${accessKey}/login`);
  const users = await getInternalUsers();
  const canManage =
    identity.id !== "demo-preview" &&
    identity.id !== "local-ui-preview" &&
    identity.roles.includes("super_admin");

  return (
    <InternalUsersManager
      users={users}
      accessKey={accessKey}
      canManage={canManage}
    />
  );
}
