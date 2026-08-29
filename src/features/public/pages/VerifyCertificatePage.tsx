import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type { CertificateStatus, PublicCertificateVerification } from "@/lib/services/certificates";

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function state(status: CertificateStatus) {
  if (status === "valid") {
    return {
      label: "Valid credential",
      description: "This credential is currently valid and was issued by Nenasala Peradeniya.",
      icon: CheckCircle2,
      tone: "border-[var(--color-success)]/25 bg-[var(--color-success-soft)] text-[var(--color-success)]",
    };
  }
  if (status === "expired") {
    return {
      label: "Expired credential",
      description: "This credential was issued by Nenasala Peradeniya but its validity period has ended.",
      icon: AlertTriangle,
      tone: "border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    };
  }
  if (status === "revoked") {
    return {
      label: "Revoked credential",
      description: "This credential exists but has been revoked and should not be treated as valid.",
      icon: ShieldX,
      tone: "border-[var(--color-error)]/25 bg-[var(--color-error-soft)] text-[var(--color-error)]",
    };
  }
  return {
    label: "Superseded credential",
    description: "This credential has been replaced by a newer credential and is retained only for verification history.",
    icon: AlertTriangle,
    tone: "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
  };
}

export default function VerifyCertificatePage({
  query,
  verification,
  searched,
}: {
  query: string;
  verification: PublicCertificateVerification | null;
  searched: boolean;
}) {
  const statusState = verification ? state(verification.credential_status) : null;
  const StatusIcon = statusState?.icon ?? ShieldCheck;

  return (
    <div className="relative flex flex-1 overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-[var(--color-primary)]/8 blur-3xl" />
        <div className="absolute bottom-20 right-[-8rem] h-72 w-72 rounded-full bg-[var(--color-secondary)]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Credential Verification</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            Verify a Nenasala certificate
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Enter the credential ID printed on a certificate. Public verification reveals only the safe credential details required to confirm authenticity.
          </p>
        </div>

        <form action="/verify" method="get" className="mx-auto mt-10 max-w-2xl">
          <div className="flex flex-col gap-3 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg shadow-[var(--color-text-primary)]/5 sm:flex-row sm:rounded-full">
            <label className="relative flex-1">
              <span className="sr-only">Credential ID</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                name="credential"
                defaultValue={query}
                autoComplete="off"
                placeholder="e.g. NPU-XXXX-XXXX"
                className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background)] pl-12 pr-4 font-mono text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-7 text-sm font-bold text-[var(--color-static-white)] transition hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-static-white)]"
            >
              Verify credential
            </button>
          </div>
        </form>

        {searched && !verification && (
          <div className="mx-auto mt-8 max-w-2xl rounded-[var(--radius-xl)] border border-[var(--color-error)]/25 bg-[var(--color-error-soft)] p-6 text-center">
            <ShieldX className="mx-auto h-8 w-8 text-[var(--color-error)]" />
            <h2 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">Credential not found</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Check the credential ID and try again. A missing result should not be treated as a valid Nenasala credential.
            </p>
          </div>
        )}

        {verification && statusState && (
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-text-primary)]/5">
            <div className={`flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center ${statusState.tone}`}>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-surface)]/80">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">{statusState.label}</h2>
                <p className="mt-1 text-sm opacity-90">{statusState.description}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">{verification.credential_title}</p>
                  <h3 className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">
                    {verification.course_title ?? verification.programme_name ?? "Nenasala Credential"}
                  </h3>
                </div>
              </div>

              <dl className="grid gap-x-8 gap-y-5 border-y border-[var(--color-border)] py-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Recipient</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{verification.recipient_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Programme</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{verification.programme_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Issued</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{formatDate(verification.issued_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Expires</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{formatDate(verification.expires_at)}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Credential ID</p>
                <p className="mt-1 break-all font-mono text-sm font-bold text-[var(--color-text-primary)]">{verification.credential_id}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
                <span>Verified against the Nenasala Peradeniya credential registry.</span>
                <Link href="/verify" className="font-bold text-[var(--color-primary)] hover:underline">Verify another</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
