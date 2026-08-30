import MessagesManager from "@/features/admin/pages/admin/MessagesManager";
import { getContactMessages } from "@/lib/services/contact-messages";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const messages = await getContactMessages();
  return <MessagesManager messages={messages} accessKey={accessKey} />;
}
