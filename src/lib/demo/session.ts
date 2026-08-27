import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "nenasala_demo_session";
const DEFAULT_SESSION_HOURS = 72;
const MAX_SESSION_HOURS = 168;

function getSecret() {
  return process.env.DEMO_ACCESS_KEY ?? "";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE === "true" && getSecret().length >= 24;
}

export function isAdminDemoEnabled() {
  return isDemoModeEnabled() && process.env.DEMO_ALLOW_ADMIN === "true";
}

export function isValidDemoAccessCode(code: string) {
  if (!isDemoModeEnabled()) return false;
  return safeEqual(code, getSecret());
}

function getSessionHours() {
  const configured = Number(process.env.DEMO_SESSION_HOURS ?? DEFAULT_SESSION_HOURS);
  if (!Number.isFinite(configured)) return DEFAULT_SESSION_HOURS;
  return Math.min(MAX_SESSION_HOURS, Math.max(1, Math.floor(configured)));
}

function createSignature(expiresAt: number) {
  return createHmac("sha256", getSecret())
    .update(`nenasala-demo:${expiresAt}`)
    .digest("hex");
}

export async function createDemoSession() {
  if (!isDemoModeEnabled()) throw new Error("Demo mode is disabled.");

  const maxAge = getSessionHours() * 60 * 60;
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const signature = createSignature(expiresAt);
  const value = `${expiresAt}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function hasValidDemoSession() {
  if (!isDemoModeEnabled()) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  return safeEqual(signature, createSignature(expiresAt));
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
