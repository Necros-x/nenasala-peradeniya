import Announcements from "@/features/student/pages/announcements/Announcements";
import RealAnnouncements from "@/features/student/pages/announcements/RealAnnouncements";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentAnnouncements } from "@/lib/services/announcements";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([hasRealStudentSession()]);
  if (!realStudent && (localPreview)) return <Announcements />;

  const announcements = await getCurrentStudentAnnouncements();
  return <RealAnnouncements announcements={announcements} />;
}
