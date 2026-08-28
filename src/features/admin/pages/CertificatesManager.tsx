"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Ban,
  ExternalLink,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/features/admin/components/ui/badge";
import { Button } from "@/features/admin/components/ui/button";
import { Card, CardContent } from "@/features/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/admin/components/ui/dialog";
import { Input } from "@/features/admin/components/ui/input";
import { Label } from "@/features/admin/components/ui/label";
import {
  issueCertificateAction,
  reissueCertificateAction,
  revokeCertificateAction,
} from "@/lib/actions/admin/certificates";
import type {
  AdminCertificateRecord,
  CertificateIssueOption,
  CertificateStatus,
} from "@/lib/services/certificates";

type Props = {
  certificates: AdminCertificateRecord[];
  issueOptions: CertificateIssueOption[];
  accessKey: string;
  readOnlyDemo: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function statusVariant(status: CertificateStatus): "success" | "danger" | "warning" | "secondary" {
  if (status === "valid") return "success";
  if (status === "revoked") return "danger";
  if (status === "expired") return "warning";
  return "secondary";
}

function statusLabel(status: CertificateStatus) {
  if (status === "valid") return "Valid";
  if (status === "revoked") return "Revoked";
  if (status === "expired") return "Expired";
  return "Superseded";
}

export default function CertificatesManager({ certificates, issueOptions, accessKey, readOnlyDemo }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CertificateStatus>("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminCertificateRecord | null>(null);
  const [reissueTarget, setReissueTarget] = useState<AdminCertificateRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return certificates.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!query) return true;
      return [
        item.credential_id,
        item.student_name,
        item.student_number,
        item.student_email,
        item.credential_title,
        item.course_title,
        item.programme_name,
        item.intake_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [certificates, search, statusFilter]);

  const validCount = certificates.filter((item) => item.status === "valid").length;
  const expiredCount = certificates.filter((item) => item.status === "expired").length;
  const revokedCount = certificates.filter((item) => item.status === "revoked").length;

  async function issueCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyDemo) return toast.error("Demo mode is read-only.");

    const formData = new FormData(event.currentTarget);
    const selection = String(formData.get("issue_selection") ?? "");
    const [studentId, classId] = selection.split(":");
    if (!studentId || !classId) return toast.error("Select a completed enrollment.");
    formData.set("student_id", studentId);
    formData.set("class_id", classId);
    formData.set("accessKey", accessKey);

    setSaving(true);
    try {
      const result = await issueCertificateAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to issue certificate.");
      toast.success(`Certificate issued${result.credentialId ? ` • ${result.credentialId}` : ""}`);
      setIssueOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function revokeCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!revokeTarget || readOnlyDemo) return;
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("certificate_id", revokeTarget.id);

    setSaving(true);
    try {
      const result = await revokeCertificateAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to revoke certificate.");
      toast.success("Certificate revoked");
      setRevokeTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function reissueCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reissueTarget || readOnlyDemo) return;
    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("certificate_id", reissueTarget.id);

    setSaving(true);
    try {
      const result = await reissueCertificateAction(formData);
      if (!result.ok) return toast.error(result.error ?? "Unable to reissue certificate.");
      toast.success(`Certificate reissued${result.credentialId ? ` • ${result.credentialId}` : ""}`);
      setReissueTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Academic Records</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Certificates</h1>
          <p className="mt-1 text-text-secondary">
            Search credentials, issue certificates for completed enrollments, revoke invalid credentials and reissue replacements.
          </p>
        </div>
        <Button onClick={() => setIssueOpen(true)} disabled={readOnlyDemo || issueOptions.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Issue Certificate
        </Button>
      </div>

      {readOnlyDemo && (
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Demo mode is read-only.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-5"><Award className="h-6 w-6 text-brand-primary" /><div><p className="text-2xl font-bold">{certificates.length}</p><p className="text-sm text-text-secondary">All credentials</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><BadgeCheck className="h-6 w-6 text-success" /><div><p className="text-2xl font-bold">{validCount}</p><p className="text-sm text-text-secondary">Valid</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><ShieldCheck className="h-6 w-6 text-warning" /><div><p className="text-2xl font-bold">{expiredCount}</p><p className="text-sm text-text-secondary">Expired</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><Ban className="h-6 w-6 text-danger" /><div><p className="text-2xl font-bold">{revokedCount}</p><p className="text-sm text-text-secondary">Revoked</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search credential ID, student, student number, course, programme or intake..."
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CertificateStatus)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All statuses</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
              <option value="superseded">Superseded</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="p-10 text-center">
            <Award className="mx-auto mb-3 h-9 w-9 text-brand-primary" />
            <h2 className="font-semibold text-foreground">No matching certificates</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {certificates.length === 0 ? "Issue a certificate after a student's enrollment is marked completed." : "Try a different search or status filter."}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3">Credential</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Qualification</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="bg-surface">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-foreground">{item.credential_id}</p>
                      <p className="mt-1 text-xs text-text-muted">{item.credential_title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{item.student_name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{item.student_number}{item.student_email ? ` • ${item.student_email}` : ""}</p>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      <p className="font-medium text-foreground">{item.course_title ?? item.programme_name ?? "Credential"}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{item.programme_name ?? "No programme"} • {item.intake_name ?? "No intake"}</p>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      <p>{formatDate(item.issued_at)}</p>
                      <p className="mt-0.5 text-xs text-text-muted">Expires: {formatDate(item.expires_at)}</p>
                    </td>
                    <td className="px-5 py-4"><Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/verify/${encodeURIComponent(item.credential_id)}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Verify
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setReissueTarget(item)} disabled={readOnlyDemo || saving || item.status === "superseded"}>
                          <RefreshCcw className="mr-2 h-4 w-4" /> Reissue
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setRevokeTarget(item)} disabled={readOnlyDemo || saving || item.status === "revoked" || item.status === "superseded"}>
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={issueOpen} onOpenChange={(open) => !saving && setIssueOpen(open)}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={issueCertificate}>
            <DialogHeader>
              <DialogTitle>Issue certificate</DialogTitle>
              <DialogDescription>
                Only enrollments already marked Completed are eligible. Course-specific quiz/assignment requirements are not assumed automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="issue_selection">Completed enrollment</Label>
                <select id="issue_selection" name="issue_selection" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">Select student and course</option>
                  {issueOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.student_name} ({option.student_number}) — {option.course_title} — {option.intake_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential_title">Credential title</Label>
                <Input id="credential_title" name="credential_title" defaultValue="Certificate of Completion" required maxLength={140} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiry date (optional)</Label>
                <Input id="expires_at" name="expires_at" type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Issuing..." : "Issue certificate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && !saving && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={revokeCertificate}>
            <DialogHeader>
              <DialogTitle>Revoke certificate</DialogTitle>
              <DialogDescription>
                {revokeTarget ? `${revokeTarget.credential_id} will immediately show as revoked in public verification.` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-5">
              <Label htmlFor="reason">Reason</Label>
              <textarea id="reason" name="reason" required minLength={3} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-brand-primary" placeholder="Why is this credential being revoked?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRevokeTarget(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={saving}>{saving ? "Revoking..." : "Revoke certificate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reissueTarget)} onOpenChange={(open) => !open && !saving && setReissueTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={reissueCertificate}>
            <DialogHeader>
              <DialogTitle>Reissue certificate</DialogTitle>
              <DialogDescription>
                A new credential ID will be generated. The current credential will become Superseded and remain searchable for audit history.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-5">
              <Label htmlFor="reissue_expires_at">Replacement expiry date (optional)</Label>
              <Input id="reissue_expires_at" name="expires_at" type="date" defaultValue={toDateInput(reissueTarget?.expires_at ?? null)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReissueTarget(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Reissuing..." : "Create replacement"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
