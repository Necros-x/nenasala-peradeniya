import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AnnouncementPriority = "general" | "course" | "urgent";
export type AnnouncementAudience = "all_students" | "programme" | "intake" | "course" | "class" | "students";
export type AnnouncementStatus = "draft" | "published" | "archived";

export type AdminAnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audience_type: AnnouncementAudience;
  programme_id: string | null;
  intake_id: string | null;
  course_id: string | null;
  class_id: string | null;
  status: AnnouncementStatus;
  publish_at: string | null;
  expires_at: string | null;
  published_at: string | null;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  audience_label: string;
  selected_student_ids: string[];
};

export type AnnouncementOption = { id: string; label: string };
export type StudentAnnouncementOption = { id: string; label: string; studentNumber: string };

export type AdminAnnouncementOptions = {
  programmes: AnnouncementOption[];
  intakes: AnnouncementOption[];
  courses: AnnouncementOption[];
  classes: AnnouncementOption[];
  students: StudentAnnouncementOption[];
};

export type StudentAnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audience_type: AnnouncementAudience;
  audience_label: string;
  publish_at: string | null;
  expires_at: string | null;
  published_at: string | null;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function audienceLabel(row: any) {
  if (row.audience_type === "all_students") return "All students";
  if (row.audience_type === "programme") {
    const programme = firstRelation(row.programmes as any) as any;
    return programme?.name ? `Programme: ${programme.name}` : "Programme students";
  }
  if (row.audience_type === "intake") {
    const intake = firstRelation(row.intakes as any) as any;
    return intake?.name ? `Intake: ${intake.name}` : "Intake students";
  }
  if (row.audience_type === "course") {
    const course = firstRelation(row.courses as any) as any;
    return course?.title ? `Course: ${course.title}` : "Course students";
  }
  if (row.audience_type === "class") {
    const classRow = firstRelation(row.classes as any) as any;
    return classRow?.name ? `Class: ${classRow.name}` : "Class students";
  }
  return "Selected students";
}

const ANNOUNCEMENT_COLUMNS =
  "id,title,body,priority,audience_type,programme_id,intake_id,course_id,class_id,status,publish_at,expires_at,published_at,is_pinned,created_by,created_at,updated_at,programmes(name),intakes(name),courses(title),classes(name)" as const;

export async function getAdminAnnouncements(): Promise<AdminAnnouncementRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data, error }, { data: selectedRows, error: selectedError }] = await Promise.all([
    supabase.from("announcements").select(ANNOUNCEMENT_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("announcement_students").select("announcement_id,student_id"),
  ]);

  if (error) {
    console.error("Unable to load announcements:", error.message);
    return [];
  }
  if (selectedError) console.error("Unable to load announcement recipients:", selectedError.message);

  const selectedByAnnouncement = new Map<string, string[]>();
  for (const row of selectedRows ?? []) {
    const list = selectedByAnnouncement.get(row.announcement_id) ?? [];
    list.push(row.student_id);
    selectedByAnnouncement.set(row.announcement_id, list);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    audience_type: row.audience_type,
    programme_id: row.programme_id ?? null,
    intake_id: row.intake_id ?? null,
    course_id: row.course_id ?? null,
    class_id: row.class_id ?? null,
    status: row.status,
    publish_at: row.publish_at ?? null,
    expires_at: row.expires_at ?? null,
    published_at: row.published_at ?? null,
    is_pinned: Boolean(row.is_pinned),
    created_by: row.created_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    audience_label: audienceLabel(row),
    selected_student_ids: selectedByAnnouncement.get(row.id) ?? [],
  }));
}

export async function getAdminAnnouncementOptions(): Promise<AdminAnnouncementOptions> {
  const supabase = await createClient();
  if (!supabase) return { programmes: [], intakes: [], courses: [], classes: [], students: [] };

  const [programmesResult, intakesResult, coursesResult, classesResult, studentsResult] = await Promise.all([
    supabase.from("programmes").select("id,name").order("name"),
    supabase.from("intakes").select("id,name").order("name"),
    supabase.from("courses").select("id,title").order("title"),
    supabase.from("classes").select("id,name,courses(title),intakes(name)").order("name"),
    supabase.from("student_profiles").select("profile_id,student_number,profiles(full_name)").order("student_number"),
  ]);

  for (const result of [programmesResult, intakesResult, coursesResult, classesResult, studentsResult]) {
    if (result.error) console.error("Unable to load announcement options:", result.error.message);
  }

  return {
    programmes: (programmesResult.data ?? []).map((row: any) => ({ id: row.id, label: row.name })),
    intakes: (intakesResult.data ?? []).map((row: any) => ({ id: row.id, label: row.name })),
    courses: (coursesResult.data ?? []).map((row: any) => ({ id: row.id, label: row.title })),
    classes: (classesResult.data ?? []).map((row: any) => {
      const course = firstRelation(row.courses as any) as any;
      const intake = firstRelation(row.intakes as any) as any;
      return {
        id: row.id,
        label: `${row.name}${course?.title ? ` · ${course.title}` : ""}${intake?.name ? ` · ${intake.name}` : ""}`,
      };
    }),
    students: (studentsResult.data ?? []).map((row: any) => {
      const profile = firstRelation(row.profiles as any) as any;
      return {
        id: row.profile_id,
        label: profile?.full_name ?? "Student",
        studentNumber: row.student_number,
      };
    }),
  };
}

async function loadCurrentStudentAnnouncements(limit?: number) {
  const supabase = await createClient();
  if (!supabase) return { studentId: null as string | null, rows: [] as StudentAnnouncementRecord[] };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { studentId: null as string | null, rows: [] as StudentAnnouncementRecord[] };

  let query = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Unable to load student announcements:", error.message);
    return { studentId: userData.user.id, rows: [] as StudentAnnouncementRecord[] };
  }

  return {
    studentId: userData.user.id,
    rows: (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      priority: row.priority,
      audience_type: row.audience_type,
      audience_label: audienceLabel(row),
      publish_at: row.publish_at ?? null,
      expires_at: row.expires_at ?? null,
      published_at: row.published_at ?? null,
      is_pinned: Boolean(row.is_pinned),
      created_at: row.created_at,
      author_name: "Nenasala Peradeniya",
    })),
  };
}

function announcementNotificationMessage(announcement: StudentAnnouncementRecord) {
  const compact = announcement.body.replace(/\s+/g, " ").trim();
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

async function syncRowsToNotifications(studentId: string, rows: StudentAnnouncementRecord[]) {
  if (rows.length === 0) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").upsert(
      rows.map((announcement) => ({
        user_id: studentId,
        title: announcement.priority === "urgent" ? `Urgent: ${announcement.title}` : announcement.title,
        message: announcementNotificationMessage(announcement),
        type: "announcement",
        link: `/student/announcements/${announcement.id}`,
        source_key: `announcement:${announcement.id}`,
      })),
      { onConflict: "user_id,source_key" }
    );
    if (error) console.error("Unable to sync announcement notifications:", error.message);
  } catch (error) {
    console.error("Unable to sync announcement notifications:", error);
  }
}

export async function syncCurrentStudentAnnouncementNotifications() {
  const { studentId, rows } = await loadCurrentStudentAnnouncements(200);
  if (!studentId) return;
  await syncRowsToNotifications(studentId, rows);
}

export async function getCurrentStudentAnnouncements(limit?: number): Promise<StudentAnnouncementRecord[]> {
  const { studentId, rows } = await loadCurrentStudentAnnouncements(limit);
  if (studentId) await syncRowsToNotifications(studentId, rows);
  return rows;
}

export async function getCurrentStudentAnnouncement(id: string): Promise<StudentAnnouncementRecord | null> {
  const supabase = await createClient();
  if (!supabase || !id) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const row: any = data;
  const announcement: StudentAnnouncementRecord = {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    audience_type: row.audience_type,
    audience_label: audienceLabel(row),
    publish_at: row.publish_at ?? null,
    expires_at: row.expires_at ?? null,
    published_at: row.published_at ?? null,
    is_pinned: Boolean(row.is_pinned),
    created_at: row.created_at,
    author_name: "Nenasala Peradeniya",
  };
  await syncRowsToNotifications(userData.user.id, [announcement]);
  return announcement;
}
