import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  redirect(`/internal/${accessKey}/instructor-portal/dashboard`);
}
