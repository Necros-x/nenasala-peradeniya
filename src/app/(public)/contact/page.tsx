import type { Metadata } from "next";
import { ContactPage } from "@/features/public/pages/ContactPage";
import { getPublicPlatformSettings } from "@/lib/services/platform-settings";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getPublicPlatformSettings();
  return <ContactPage settings={settings} />;
}
