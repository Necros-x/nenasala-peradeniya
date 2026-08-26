import type { Metadata } from "next";
import { IntakesPage } from "@/features/public/pages/IntakesPage";
export const metadata: Metadata = { title: "Intakes" };
export default function Page() { return <IntakesPage />; }
