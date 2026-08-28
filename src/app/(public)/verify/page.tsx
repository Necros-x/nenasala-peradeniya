import type { Metadata } from "next";
import VerifyCertificatePage from "@/features/public/pages/VerifyCertificatePage";
import { verifyCertificatePublic } from "@/lib/services/certificates";

export const metadata: Metadata = {
  title: "Verify Certificate | Nenasala Peradeniya",
  description: "Verify a Nenasala Peradeniya credential using its credential ID.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ credential?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.credential) ? params.credential[0] : params.credential;
  const query = (raw ?? "").trim();
  const verification = query ? await verifyCertificatePublic(query) : null;

  return <VerifyCertificatePage query={query} verification={verification} searched={Boolean(query)} />;
}
