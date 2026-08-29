import Settings from "@/features/student/pages/Settings";
import RealSettings from "@/features/student/pages/RealSettings";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentSettings } from "@/lib/services/preferences";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([hasRealStudentSession(), hasValidDemoSession()]);

  if (!realStudent && (demo || localPreview)) return <Settings />;

  const settings = await getCurrentStudentSettings();
  if (!settings) return <Settings />;
  return <RealSettings initialSettings={settings} />;
}
