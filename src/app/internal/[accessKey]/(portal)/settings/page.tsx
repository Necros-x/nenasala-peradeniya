import PlatformSettingsManager from "@/features/admin/pages/admin/PlatformSettingsManager";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminPlatformSettings } from "@/lib/services/platform-settings";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const identity = await requireAdmin(`/internal/${accessKey}/login`);
  const data = await getAdminPlatformSettings();
  const canEdit =
    identity.id !== "demo-preview" &&
    identity.id !== "local-ui-preview" &&
    identity.roles.includes("super_admin");

  return (
    <PlatformSettingsManager
      settings={data.settings}
      resend={data.resend}
      accessKey={accessKey}
      canEdit={canEdit}
    />
  );
}
