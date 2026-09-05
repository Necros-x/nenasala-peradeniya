import { LMSManagementShell } from "@/components/admin/LMSManagementShell";
import { requireAdmin } from "@/lib/auth/guards";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const identity = await requireAdmin(`/internal/${accessKey}/login`);
  return <LMSManagementShell roles={identity.roles}><PageTransition>{children}</PageTransition></LMSManagementShell>;
}
