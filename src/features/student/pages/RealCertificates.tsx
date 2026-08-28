import Link from "next/link";
import { Award, CalendarDays, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/features/student/components/ui/Badge";
import { Button } from "@/features/student/components/ui/Button";
import { Card } from "@/features/student/components/ui/Card";
import type { CertificateStatus, StudentCertificateRecord } from "@/lib/services/certificates";

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function statusVariant(status: CertificateStatus): "success" | "error" | "warning" | "secondary" {
  if (status === "valid") return "success";
  if (status === "revoked") return "error";
  if (status === "expired") return "warning";
  return "secondary";
}

function statusLabel(status: CertificateStatus) {
  if (status === "valid") return "Valid";
  if (status === "revoked") return "Revoked";
  if (status === "expired") return "Expired";
  return "Superseded";
}

export default function RealCertificates({ certificates }: { certificates: StudentCertificateRecord[] }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Certificates</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Your issued credentials and their current public verification status.
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary-soft)]">
              <Award className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No certificates yet</h2>
            <p className="mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">
              Certificates appear here after your enrollment has been completed and a credential has been issued.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="flex h-full flex-col overflow-hidden">
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)]">
                    <Award className="h-7 w-7 text-[var(--color-warning)]" />
                  </div>
                  <Badge variant={statusVariant(certificate.status)}>{statusLabel(certificate.status)}</Badge>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  {certificate.credential_title}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-tight text-[var(--color-text-primary)]">
                  {certificate.course_title ?? certificate.programme_name ?? "Nenasala Credential"}
                </h2>
                {certificate.programme_name && certificate.programme_name !== certificate.course_title && (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{certificate.programme_name}</p>
                )}
                {certificate.intake_name && (
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">{certificate.intake_name}</p>
                )}

                <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[var(--color-text-muted)]"><CalendarDays className="h-4 w-4" /> Issued</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{formatDate(certificate.issued_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--color-text-muted)]">Expires</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{formatDate(certificate.expires_at)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[var(--color-text-muted)]">Credential ID</span>
                    <div className="break-all rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] px-3 py-2 font-mono text-xs font-bold text-[var(--color-text-secondary)]">
                      {certificate.credential_id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 p-4">
                <Link href={`/verify/${encodeURIComponent(certificate.credential_id)}`} target="_blank">
                  <Button variant="outline" className="w-full">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Public verification <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
