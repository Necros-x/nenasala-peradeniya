import type { Metadata } from "next";
import { LoginPage } from "@/features/public/pages/LoginPage";
export const metadata: Metadata = { title: "Student Login" };
export default function Page() { return <LoginPage />; }
