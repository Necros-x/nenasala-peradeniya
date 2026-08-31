"use server";

import { getAdminAttentionData } from "@/lib/services/admin-analytics";

export async function getAdminAttentionAction() {
  return getAdminAttentionData();
}
