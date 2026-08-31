import Dashboard from "@/features/student/pages/Dashboard";
import RealDashboard from "@/features/student/pages/RealDashboard";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentDashboard } from "@/lib/services/student-dashboard";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <Dashboard />;

  const data = await getCurrentStudentDashboard();
  return <RealDashboard data={data} />;
}
