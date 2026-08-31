export type AccountRole = "student" | "instructor" | "staff" | "admin" | "super_admin";

export type AccountProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: string | null;
  roles: AccountRole[];
};

export type StudentEnrollmentSummary = {
  id: string;
  status: "pending" | "active" | "paused" | "completed" | "cancelled";
  enrolledAt: string | null;
  completedAt: string | null;
  intakeName: string | null;
  programmeName: string | null;
};

export type StudentAccountProfile = AccountProfile & {
  studentNumber: string;
  joinedAt: string | null;
  currentEnrollment: StudentEnrollmentSummary | null;
};
