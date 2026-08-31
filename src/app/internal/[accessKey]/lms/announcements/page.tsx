import AnnouncementsManager from "@/features/admin/pages/lms/AnnouncementsManager";
import { getAdminAnnouncementOptions, getAdminAnnouncements } from "@/lib/services/announcements";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [announcements, options] = await Promise.all([
    getAdminAnnouncements(),
    getAdminAnnouncementOptions(),
  ]);

  return (
    <AnnouncementsManager
      announcements={announcements}
      options={options}
      accessKey={accessKey}
      readOnlyDemo={false}
    />
  );
}
