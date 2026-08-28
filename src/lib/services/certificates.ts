import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CertificateStatus = "valid" | "revoked" | "expired" | "superseded";

export type AdminCertificateRecord = {
  id: string;
  student_id: string;
  student_number: string;
  student_name: string;
  student_email: string | null;
  programme_id: string | null;
  programme_name: string | null;
  course_id: string | null;
  course_title: string | null;
  intake_id: string | null;
  intake_name: string | null;
  credential_id: string;
  credential_title: string;
  issued_at: string;
  expires_at: string | null;
  status: CertificateStatus;
  stored_status: CertificateStatus;
  metadata: Record<string, unknown>;
};

export type CertificateIssueOption = {
  key: string;
  student_id: string;
  student_number: string;
  student_name: string;
  student_email: string | null;
  class_id: string;
  class_name: string;
  course_id: string;
  course_title: string;
  intake_id: string;
  intake_name: string;
  programme_id: string;
  programme_name: string;
};

export type StudentCertificateRecord = {
  id: string;
  credential_id: string;
  credential_title: string;
  programme_name: string | null;
  course_title: string | null;
  intake_name: string | null;
  issued_at: string;
  expires_at: string | null;
  status: CertificateStatus;
};

export type PublicCertificateVerification = {
  credential_id: string;
  recipient_name: string;
  credential_title: string;
  programme_name: string | null;
  course_title: string | null;
  issued_at: string;
  expires_at: string | null;
  credential_status: CertificateStatus;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function effectiveCertificateStatus(
  status: CertificateStatus,
  expiresAt: string | null | undefined
): CertificateStatus {
  if (status === "valid" && expiresAt && new Date(expiresAt).getTime() < Date.now()) return "expired";
  return status;
}

const ADMIN_CERTIFICATE_COLUMNS =
  "id,student_id,programme_id,course_id,intake_id,credential_id,recipient_name,title,issued_at,expires_at,status,metadata,student_profiles(student_number,profiles(full_name,email)),programmes(name),courses(title),intakes(name)" as const;

export async function getAdminCertificates(): Promise<AdminCertificateRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("certificates")
    .select(ADMIN_CERTIFICATE_COLUMNS)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Unable to load certificates:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const student = firstRelation(row.student_profiles as any) as any;
    const profile = firstRelation(student?.profiles as any) as any;
    const programme = firstRelation(row.programmes as any) as any;
    const course = firstRelation(row.courses as any) as any;
    const intake = firstRelation(row.intakes as any) as any;
    const storedStatus = row.status as CertificateStatus;

    return {
      id: row.id,
      student_id: row.student_id,
      student_number: student?.student_number ?? "—",
      student_name: profile?.full_name ?? row.recipient_name ?? "Student",
      student_email: profile?.email ?? null,
      programme_id: row.programme_id ?? null,
      programme_name: programme?.name ?? null,
      course_id: row.course_id ?? null,
      course_title: course?.title ?? null,
      intake_id: row.intake_id ?? null,
      intake_name: intake?.name ?? null,
      credential_id: row.credential_id,
      credential_title: row.title,
      issued_at: row.issued_at,
      expires_at: row.expires_at ?? null,
      status: effectiveCertificateStatus(storedStatus, row.expires_at),
      stored_status: storedStatus,
      metadata: asMetadata(row.metadata),
    } satisfies AdminCertificateRecord;
  });
}

export async function getCertificateIssueOptions(): Promise<CertificateIssueOption[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("student_id,intake_id,status,student_profiles(student_number,profiles(full_name,email)),intakes(name,programme_id,programmes(name))")
    .eq("status", "completed")
    .order("completed_at", { ascending: false, nullsFirst: false });

  if (enrollmentError) {
    console.error("Unable to load certificate-eligible enrollments:", enrollmentError.message);
    return [];
  }

  const intakeIds = [...new Set((enrollments ?? []).map((row: any) => row.intake_id).filter(Boolean))];
  if (intakeIds.length === 0) return [];

  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("id,intake_id,course_id,name,status,courses(title)")
    .in("intake_id", intakeIds)
    .in("status", ["scheduled", "active", "completed"])
    .order("start_date", { ascending: false, nullsFirst: false });

  if (classError) {
    console.error("Unable to load certificate class options:", classError.message);
    return [];
  }

  const classesByIntake = new Map<string, any[]>();
  for (const classRow of classes ?? []) {
    const bucket = classesByIntake.get(classRow.intake_id) ?? [];
    bucket.push(classRow);
    classesByIntake.set(classRow.intake_id, bucket);
  }

  const options: CertificateIssueOption[] = [];
  for (const enrollment of enrollments ?? []) {
    const student = firstRelation((enrollment as any).student_profiles as any) as any;
    const profile = firstRelation(student?.profiles as any) as any;
    const intake = firstRelation((enrollment as any).intakes as any) as any;
    const programme = firstRelation(intake?.programmes as any) as any;

    for (const classRow of classesByIntake.get((enrollment as any).intake_id) ?? []) {
      const course = firstRelation(classRow.courses as any) as any;
      if (!intake?.programme_id || !classRow.course_id) continue;
      options.push({
        key: `${(enrollment as any).student_id}:${classRow.id}`,
        student_id: (enrollment as any).student_id,
        student_number: student?.student_number ?? "—",
        student_name: profile?.full_name ?? "Student",
        student_email: profile?.email ?? null,
        class_id: classRow.id,
        class_name: classRow.name,
        course_id: classRow.course_id,
        course_title: course?.title ?? "Course",
        intake_id: (enrollment as any).intake_id,
        intake_name: intake?.name ?? "Intake",
        programme_id: intake.programme_id,
        programme_name: programme?.name ?? "Programme",
      });
    }
  }

  return options.sort((a, b) =>
    a.student_name.localeCompare(b.student_name) || a.course_title.localeCompare(b.course_title)
  );
}

export async function getCurrentStudentCertificates(): Promise<StudentCertificateRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("certificates")
    .select("id,credential_id,title,issued_at,expires_at,status,programmes(name),courses(title),intakes(name)")
    .eq("student_id", userData.user.id)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Unable to load student certificates:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const programme = firstRelation(row.programmes as any) as any;
    const course = firstRelation(row.courses as any) as any;
    const intake = firstRelation(row.intakes as any) as any;
    return {
      id: row.id,
      credential_id: row.credential_id,
      credential_title: row.title,
      programme_name: programme?.name ?? null,
      course_title: course?.title ?? null,
      intake_name: intake?.name ?? null,
      issued_at: row.issued_at,
      expires_at: row.expires_at ?? null,
      status: effectiveCertificateStatus(row.status as CertificateStatus, row.expires_at),
    } satisfies StudentCertificateRecord;
  });
}

export async function verifyCertificatePublic(
  credentialId: string
): Promise<PublicCertificateVerification | null> {
  const normalized = credentialId.trim();
  if (!normalized) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("verify_certificate", {
    p_credential_id: normalized,
  });

  if (error) {
    console.error("Unable to verify certificate:", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    credential_id: row.credential_id,
    recipient_name: row.recipient_name,
    credential_title: row.credential_title,
    programme_name: row.programme_name ?? null,
    course_title: row.course_title ?? null,
    issued_at: row.issued_at,
    expires_at: row.expires_at ?? null,
    credential_status: row.credential_status as CertificateStatus,
  };
}
