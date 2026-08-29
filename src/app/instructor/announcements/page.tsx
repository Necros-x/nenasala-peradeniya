import InstructorAnnouncements from "@/features/instructor/pages/InstructorAnnouncements";
import { getInstructorAnnouncements, getInstructorClasses } from "@/lib/services/instructor-portal";

export default async function Page() {
  const [classes, announcements] = await Promise.all([getInstructorClasses(), getInstructorAnnouncements()]);
  return <InstructorAnnouncements classes={classes} announcements={announcements} />;
}
