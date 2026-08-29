import ControlCenter from "@/features/admin/pages/ControlCenter";
import { requireInternalAccess } from "@/lib/auth/guards";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireInternalAccess(`/internal/${accessKey}/login`);
  return <ControlCenter roles={identity.roles} />;
}
