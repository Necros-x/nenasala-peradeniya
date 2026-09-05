import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdministrationAccess } from "@/lib/auth/guards";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const identity = await requireAdministrationAccess(`/internal/${accessKey}/login`);
  return <AdminShell roles={identity.roles}><PageTransition>{children}</PageTransition></AdminShell>;
}
