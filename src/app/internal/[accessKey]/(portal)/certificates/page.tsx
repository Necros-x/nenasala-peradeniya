import CertificatesManager from "@/features/admin/pages/CertificatesManager";
import { getAdminCertificates, getCertificateIssueOptions } from "@/lib/services/certificates";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [certificates, issueOptions] = await Promise.all([
    getAdminCertificates(),
    getCertificateIssueOptions(),
  ]);

  return (
    <CertificatesManager
      certificates={certificates}
      issueOptions={issueOptions}
      accessKey={accessKey}
      readOnlyDemo={false}
    />
  );
}
