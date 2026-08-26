import type { Metadata } from "next";
import { FAQPage } from "@/features/public/pages/FAQPage";
export const metadata: Metadata = { title: "FAQ" };
export default function Page() { return <FAQPage />; }
