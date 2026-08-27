import { NextResponse } from "next/server";
import {
  createDemoSession,
  isDemoModeEnabled,
  isValidDemoAccessCode,
} from "@/lib/demo/session";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isDemoModeEnabled()) {
    return NextResponse.redirect(`${origin}/`, 303);
  }

  const form = await request.formData();
  const code = String(form.get("code") ?? "");

  if (!isValidDemoAccessCode(code)) {
    return NextResponse.redirect(`${origin}/demo-access?error=invalid`, 303);
  }

  await createDemoSession();
  return NextResponse.redirect(`${origin}/student/dashboard`, 303);
}
