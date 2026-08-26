import type { Metadata } from "next";
import StudentLayout from "@/features/student/components/layout/StudentLayout";
import { RouteBaseProvider } from "@/lib/router-compat";
import { requireStudent } from "@/lib/auth/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireStudent();
  return (
    <RouteBaseProvider base="/student">
      <StudentLayout>{children}</StudentLayout>
    </RouteBaseProvider>
  );
}
