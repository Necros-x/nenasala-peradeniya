import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdministrationAccess } from "@/lib/auth/guards";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireAdministrationAccess(`/internal/${accessKey}/login`);
  return <AdminShell roles={identity.roles}>{children}</AdminShell>;
}
