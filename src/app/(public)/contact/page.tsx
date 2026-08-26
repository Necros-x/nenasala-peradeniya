import type { Metadata } from "next";
import { ContactPage } from "@/features/public/pages/ContactPage";
export const metadata: Metadata = { title: "Contact" };
export default function Page() { return <ContactPage />; }
