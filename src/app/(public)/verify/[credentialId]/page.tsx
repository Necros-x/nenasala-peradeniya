import type { Metadata } from "next";
import VerifyCertificatePage from "@/features/public/pages/VerifyCertificatePage";
import { verifyCertificatePublic } from "@/lib/services/certificates";

export const metadata: Metadata = {
  title: "Credential Verification | Nenasala Peradeniya",
  description: "Public Nenasala Peradeniya credential verification.",
};

export default async function Page({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;
  const query = decodeURIComponent(credentialId).trim();
  const verification = query ? await verifyCertificatePublic(query) : null;

  return <VerifyCertificatePage query={query} verification={verification} searched />;
}
