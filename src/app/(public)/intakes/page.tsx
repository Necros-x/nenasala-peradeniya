import type { Metadata } from "next";
import { IntakesPage } from "@/features/public/pages/IntakesPage";
import { getPublicIntakes } from "@/lib/services/intakes";
export const metadata: Metadata = { title: "Intakes" };
export default async function Page(){return <IntakesPage initialIntakes={await getPublicIntakes()}/>;}
