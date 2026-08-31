import Settings from "@/features/student/pages/Settings";
import RealSettings from "@/features/student/pages/RealSettings";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentSettings } from "@/lib/services/preferences";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const realStudent = await hasRealStudentSession();

  if (!realStudent && localPreview) return <Settings />;

  const settings = await getCurrentStudentSettings();
  if (!settings) return <Settings />;
  return <RealSettings initialSettings={settings} />;
}
