import { NextResponse } from "next/server";
import { clearDemoSession } from "@/lib/demo/session";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  await clearDemoSession();
  return NextResponse.redirect(`${origin}/`, 303);
}
