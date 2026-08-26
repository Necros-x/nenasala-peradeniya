import type { Metadata } from "next";
import { CoursesPage } from "@/features/public/pages/CoursesPage";
export const metadata: Metadata = { title: "Courses" };
export default function Page() { return <CoursesPage />; }
