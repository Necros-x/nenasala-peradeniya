import AnnouncementDetails from "@/features/student/pages/announcements/AnnouncementDetails";
import RealAnnouncementDetails from "@/features/student/pages/announcements/RealAnnouncementDetails";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { hasValidDemoSession } from "@/lib/demo/session";
import { getCurrentStudentAnnouncement } from "@/lib/services/announcements";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent, demo] = await Promise.all([hasRealStudentSession(), hasValidDemoSession()]);
  if (!realStudent && (demo || localPreview)) return <AnnouncementDetails />;

  const announcement = await getCurrentStudentAnnouncement(id);
  return <RealAnnouncementDetails announcement={announcement} />;
}
