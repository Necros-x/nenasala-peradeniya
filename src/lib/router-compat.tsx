"use client";

import React, { createContext, useContext, useEffect } from "react";
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter
} from "next/navigation";

const RouteBaseContext = createContext("");

export function RouteBaseProvider({ base = "", children }: { base?: string; children: React.ReactNode }) {
  const normalized = base === "/" ? "" : base.replace(/\/$/, "");
  return <RouteBaseContext.Provider value={normalized}>{children}</RouteBaseContext.Provider>;
}

function resolveTarget(base: string, target: string) {
  if (!target) return base || "/";
  if (/^(https?:|mailto:|tel:|#)/.test(target)) return target;
  if (base && (target === base || target.startsWith(`${base}/`))) return target;
  if (!base) return target;
  if (target === "/") return base || "/";
  if (target.startsWith("/")) return `${base}${target}`;
  return `${base}/${target}`;
}

function stripBase(base: string, pathname: string) {
  if (!base) return pathname;
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || "/";
  return pathname;
}

export function Link({ to, href, ...props }: any) {
  const base = useContext(RouteBaseContext);
  const target = String(to ?? href ?? "/");
  return <NextLink href={resolveTarget(base, target)} {...props} />;
}

export function useNavigate() {
  const router = useRouter();
  const base = useContext(RouteBaseContext);
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    const target = resolveTarget(base, to);
    if (options?.replace) router.replace(target);
    else router.push(target);
  };
}

export function useLocation() {
  const pathname = usePathname();
  const base = useContext(RouteBaseContext);
  return {
    pathname: stripBase(base, pathname),
    search: "",
    hash: "",
    state: null,
    key: "next",
  };
}

export function useParams<T = Record<string, string | string[]>>() {
  return useNextParams() as T;
}

export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useRouter();
  const base = useContext(RouteBaseContext);
  useEffect(() => {
    const target = resolveTarget(base, to);
    if (replace) router.replace(target);
    else router.push(target);
  }, [base, replace, router, to]);
  return null;
}

/* Migration-only exports. The final project does not use React Router routing. */
export function BrowserRouter({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Routes({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Route() { return null; }
export function Outlet() { return null; }
