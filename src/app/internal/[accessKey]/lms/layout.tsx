import { LMSManagementShell } from "@/components/admin/LMSManagementShell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  await requireAdmin(`/internal/${accessKey}/login`);
  return <LMSManagementShell>{children}</LMSManagementShell>;
}
