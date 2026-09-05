import type { Metadata } from "next";
import { InstructorsPage } from "@/features/public/pages/InstructorsPage";
export const metadata: Metadata = { title: "Lecturers" };
export default function Page() { return <InstructorsPage />; }
