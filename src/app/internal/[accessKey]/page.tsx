import ControlCenter from "@/features/admin/pages/ControlCenter";
import { requireInternalAccess } from "@/lib/auth/guards";
import { getAdminAttentionData } from "@/lib/services/admin-analytics";

const emptyAttention = {
  pendingEnrollments: 0,
  ungradedSubmissions: 0,
  unassignedClasses: 0,
  closingIntakes: 0,
  scheduledAnnouncements: 0,
  total: 0,
};

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireInternalAccess(`/internal/${accessKey}/login`);
  const canSeeAdminData = identity.roles.some((role) => role === "admin" || role === "super_admin");
  const attention = canSeeAdminData ? await getAdminAttentionData() : emptyAttention;

  return <ControlCenter roles={identity.roles} attention={attention} />;
}
