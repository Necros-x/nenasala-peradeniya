import ControlCenter from "@/features/admin/pages/ControlCenter";
import { requireAdmin } from "@/lib/auth/guards";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  await requireAdmin(`/internal/${accessKey}/login`);
  return <ControlCenter />;
}
