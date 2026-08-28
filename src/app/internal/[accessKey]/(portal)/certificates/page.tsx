import CertificatesManager from "@/features/admin/pages/CertificatesManager";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
import { getAdminCertificates, getCertificateIssueOptions } from "@/lib/services/certificates";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [certificates, issueOptions, demo] = await Promise.all([
    getAdminCertificates(),
    getCertificateIssueOptions(),
    hasValidDemoSession(),
  ]);

  return (
    <CertificatesManager
      certificates={certificates}
      issueOptions={issueOptions}
      accessKey={accessKey}
      readOnlyDemo={isAdminDemoEnabled() && demo}
    />
  );
}
