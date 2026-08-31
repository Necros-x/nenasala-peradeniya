"use server";

import { getAdminAttentionData } from "@/lib/services/admin-analytics";
import { getNewContactMessageCount } from "@/lib/services/contact-messages";

export async function getAdminAttentionAction() {
  const [attention, newContactMessages] = await Promise.all([
    getAdminAttentionData(),
    getNewContactMessageCount(),
  ]);

  return {
    ...attention,
    newContactMessages,
    total: attention.total + newContactMessages,
  };
}
