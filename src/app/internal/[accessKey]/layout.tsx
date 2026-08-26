import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { RouteBaseProvider } from "@/lib/router-compat";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  if (!isValidAdminAccessKey(accessKey)) notFound();
  return <RouteBaseProvider base={`/internal/${accessKey}`}>{children}</RouteBaseProvider>;
}
