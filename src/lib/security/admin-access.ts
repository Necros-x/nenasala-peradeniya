import "server-only";
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isValidAdminAccessKey(candidate: string) {
  const expected = process.env.ADMIN_PORTAL_KEY;
  if (!expected || expected.length < 24) return false;
  return safeEqual(candidate, expected);
}
