"use server";

import { revalidatePath } from "next/cache";
import { requireRealAdmin } from "@/lib/auth/guards";
import { isValidAdminAccessKey } from "@/lib/security/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

export type CertificateActionState = { ok: boolean; error?: string; credentialId?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function expiryIso(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function metadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function adminContext(formData: FormData) {
  const accessKey = text(formData, "accessKey");
  if (!isValidAdminAccessKey(accessKey)) return { error: "Invalid admin route." as const };

  const admin = await requireRealAdmin();
  if (!admin) return { error: "Demo/preview mode is read-only." as const };

  try {
    return { accessKey, admin, supabase: createAdminClient() };
  } catch {
    return { error: "Server administration client is not configured." as const };
  }
}

function revalidateCertificatePaths(accessKey: string, credentialIds: string[] = []) {
  revalidatePath(`/internal/${accessKey}/certificates`);
  revalidatePath("/student/certificates");
  revalidatePath("/student/notifications");
  revalidatePath("/verify");
  for (const id of credentialIds) revalidatePath(`/verify/${id}`);
}

async function notifyStudent(
  supabase: ReturnType<typeof createAdminClient>,
  studentId: string,
  title: string,
  message: string,
  sourceKey: string
) {
  const { error } = await supabase.from("notifications").upsert({
    user_id: studentId,
    title,
    message,
    type: "system",
    link: "/student/certificates",
    source_key: sourceKey,
  }, { onConflict: "user_id,source_key", ignoreDuplicates: true });

  if (error) console.error("Certificate updated but notification creation failed:", error.message);
}

export async function issueCertificateAction(formData: FormData): Promise<CertificateActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const studentId = text(formData, "student_id");
  const classId = text(formData, "class_id");
  const credentialTitle = text(formData, "credential_title") || "Certificate of Completion";
  const expiresAtRaw = text(formData, "expires_at");
  const expiresAt = expiryIso(expiresAtRaw);

  if (!studentId || !classId) return { ok: false, error: "Select a completed student enrollment." };
  if (credentialTitle.length < 3 || credentialTitle.length > 140) {
    return { ok: false, error: "Credential title must be between 3 and 140 characters." };
  }
  if (expiresAtRaw && !expiresAt) return { ok: false, error: "Expiry date is invalid." };

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,intake_id,course_id,name,status,intakes(name,programme_id,programmes(name)),courses(title)")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classRow) return { ok: false, error: "The selected class could not be found." };
  if (classRow.status === "cancelled") return { ok: false, error: "Cancelled classes cannot issue certificates." };

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("student_id", studentId)
    .eq("intake_id", classRow.intake_id)
    .eq("status", "completed")
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    return { ok: false, error: "Certificates can only be issued after the enrollment is marked completed." };
  }

  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("student_number,profiles(full_name,email)")
    .eq("profile_id", studentId)
    .maybeSingle();

  if (studentError || !student) return { ok: false, error: "Student profile could not be found." };
  const profile = firstRelation((student as any).profiles as any) as any;
  const recipientName = profile?.full_name?.trim();
  if (!recipientName) return { ok: false, error: "The student profile needs a full name before issuing a certificate." };

  const intake = firstRelation((classRow as any).intakes as any) as any;
  const programme = firstRelation(intake?.programmes as any) as any;
  const course = firstRelation((classRow as any).courses as any) as any;
  if (!intake?.programme_id) return { ok: false, error: "The selected intake is missing its programme." };

  const { data: existing } = await supabase
    .from("certificates")
    .select("id,credential_id,expires_at,status")
    .eq("student_id", studentId)
    .eq("course_id", classRow.course_id)
    .eq("intake_id", classRow.intake_id)
    .eq("status", "valid")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && (!existing.expires_at || new Date(existing.expires_at).getTime() > Date.now())) {
    return { ok: false, error: `This student already has an active certificate (${existing.credential_id}). Use Reissue instead.` };
  }

  const { data: certificate, error: insertError } = await supabase
    .from("certificates")
    .insert({
      student_id: studentId,
      programme_id: intake.programme_id,
      course_id: classRow.course_id,
      intake_id: classRow.intake_id,
      recipient_name: recipientName,
      title: credentialTitle,
      expires_at: expiresAt,
      status: "valid",
      metadata: {
        issued_by: admin.id,
        source_class_id: classRow.id,
        source_enrollment_id: enrollment.id,
      },
    })
    .select("id,credential_id")
    .single();

  if (insertError || !certificate) {
    console.error("Unable to issue certificate:", insertError);
    return { ok: false, error: "Unable to issue the certificate." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "certificate.issued",
    entity_type: "certificate",
    entity_id: certificate.id,
    metadata: {
      credential_id: certificate.credential_id,
      student_id: studentId,
      course_id: classRow.course_id,
      intake_id: classRow.intake_id,
    },
  });

  await notifyStudent(
    supabase,
    studentId,
    "Certificate issued",
    `Your ${credentialTitle} for ${course?.title ?? programme?.name ?? "your completed programme"} is now available. Credential ID: ${certificate.credential_id}.`,
    `certificate-issued:${certificate.id}`
  );

  revalidateCertificatePaths(accessKey, [certificate.credential_id]);
  return { ok: true, credentialId: certificate.credential_id };
}

export async function revokeCertificateAction(formData: FormData): Promise<CertificateActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const certificateId = text(formData, "certificate_id");
  const reason = text(formData, "reason");
  if (!certificateId) return { ok: false, error: "Certificate is required." };
  if (reason.length < 3) return { ok: false, error: "Add a short reason for revocation." };

  const { data: certificate, error: findError } = await supabase
    .from("certificates")
    .select("id,student_id,credential_id,title,status,metadata")
    .eq("id", certificateId)
    .maybeSingle();

  if (findError || !certificate) return { ok: false, error: "Certificate could not be found." };
  if (certificate.status === "revoked") return { ok: false, error: "Certificate is already revoked." };
  if (certificate.status === "superseded") return { ok: false, error: "Superseded certificates cannot be revoked." };

  const { error: updateError } = await supabase
    .from("certificates")
    .update({
      status: "revoked",
      metadata: {
        ...metadata(certificate.metadata),
        revoked_at: new Date().toISOString(),
        revoked_by: admin.id,
        revocation_reason: reason,
      },
    })
    .eq("id", certificateId);

  if (updateError) {
    console.error("Unable to revoke certificate:", updateError);
    return { ok: false, error: "Unable to revoke the certificate." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "certificate.revoked",
    entity_type: "certificate",
    entity_id: certificateId,
    metadata: { credential_id: certificate.credential_id, reason },
  });

  await notifyStudent(
    supabase,
    certificate.student_id,
    "Certificate status updated",
    `Certificate ${certificate.credential_id} has been revoked. Contact Nenasala if you need clarification.`,
    `certificate-revoked:${certificateId}`
  );

  revalidateCertificatePaths(accessKey, [certificate.credential_id]);
  return { ok: true };
}

export async function reissueCertificateAction(formData: FormData): Promise<CertificateActionState> {
  const ctx = await adminContext(formData);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { accessKey, admin, supabase } = ctx;

  const certificateId = text(formData, "certificate_id");
  const expiresAtRaw = text(formData, "expires_at");
  const expiresAt = expiryIso(expiresAtRaw);
  if (!certificateId) return { ok: false, error: "Certificate is required." };
  if (expiresAtRaw && !expiresAt) return { ok: false, error: "Expiry date is invalid." };

  const { data: oldCertificate, error: findError } = await supabase
    .from("certificates")
    .select("id,student_id,programme_id,course_id,intake_id,credential_id,recipient_name,title,expires_at,status,metadata")
    .eq("id", certificateId)
    .maybeSingle();

  if (findError || !oldCertificate) return { ok: false, error: "Certificate could not be found." };
  if (oldCertificate.status === "superseded") return { ok: false, error: "This certificate has already been superseded." };

  const previousMetadata = metadata(oldCertificate.metadata);
  const { error: supersedeError } = await supabase
    .from("certificates")
    .update({
      status: "superseded",
      metadata: {
        ...previousMetadata,
        superseded_at: new Date().toISOString(),
        superseded_by: admin.id,
      },
    })
    .eq("id", certificateId);

  if (supersedeError) return { ok: false, error: "Unable to supersede the existing certificate." };

  const { data: replacement, error: insertError } = await supabase
    .from("certificates")
    .insert({
      student_id: oldCertificate.student_id,
      programme_id: oldCertificate.programme_id,
      course_id: oldCertificate.course_id,
      intake_id: oldCertificate.intake_id,
      recipient_name: oldCertificate.recipient_name,
      title: oldCertificate.title,
      expires_at: expiresAtRaw ? expiresAt : oldCertificate.expires_at,
      status: "valid",
      metadata: {
        reissued_by: admin.id,
        supersedes_certificate_id: oldCertificate.id,
        supersedes_credential_id: oldCertificate.credential_id,
      },
    })
    .select("id,credential_id")
    .single();

  if (insertError || !replacement) {
    await supabase
      .from("certificates")
      .update({ status: oldCertificate.status, metadata: previousMetadata })
      .eq("id", certificateId);
    console.error("Unable to create replacement certificate:", insertError);
    return { ok: false, error: "Unable to create the replacement certificate. The original status was restored." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "certificate.reissued",
    entity_type: "certificate",
    entity_id: replacement.id,
    metadata: {
      old_certificate_id: oldCertificate.id,
      old_credential_id: oldCertificate.credential_id,
      new_credential_id: replacement.credential_id,
    },
  });

  await notifyStudent(
    supabase,
    oldCertificate.student_id,
    "Certificate reissued",
    `A replacement certificate is available. New credential ID: ${replacement.credential_id}. The previous credential is now superseded.`,
    `certificate-reissued:${replacement.id}`
  );

  revalidateCertificatePaths(accessKey, [oldCertificate.credential_id, replacement.credential_id]);
  return { ok: true, credentialId: replacement.credential_id };
}
