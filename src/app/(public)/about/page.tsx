import type { Metadata } from "next";
import { AboutPage } from "@/features/public/pages/AboutPage";
export const metadata: Metadata = { title: "About" };
export default function Page() { return <AboutPage />; }
