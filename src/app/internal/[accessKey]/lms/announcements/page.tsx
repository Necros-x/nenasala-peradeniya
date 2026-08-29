import AnnouncementsManager from "@/features/admin/pages/lms/AnnouncementsManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminAnnouncementOptions, getAdminAnnouncements } from "@/lib/services/announcements";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [announcements, options, demo] = await Promise.all([
    getAdminAnnouncements(),
    getAdminAnnouncementOptions(),
    hasValidDemoSession(),
  ]);

  return (
    <AnnouncementsManager
      announcements={announcements}
      options={options}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
