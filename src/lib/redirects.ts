// Pure request-canonicalisation logic, shared by the SSR server entry.
//
// Two permanent (301) redirects are enforced:
//   1. Apex host -> www host (canonical host is https://www.fertafind.com).
//   2. /partners -> /suppliers (the marketplace page moved).
//
// The logic is deliberately narrow so it can never loop: the www host and the
// /suppliers target are terminal, and preview/local hosts are left untouched.

import { SITE_URL } from "./seo.ts";

const APEX_HOST = "fertafind.com";

export interface RedirectInput {
  host: string | null | undefined;
  pathname: string;
  search: string;
}

export interface RedirectResult {
  location: string;
  status: 301;
}

export function computeRedirect({
  host,
  pathname,
  search,
}: RedirectInput): RedirectResult | null {
  const normalizedHost = (host ?? "").toLowerCase().split(":")[0];

  let targetPath = pathname;
  if (pathname === "/partners" || pathname === "/partners/") {
    targetPath = "/suppliers";
  }

  const hostNeedsRedirect = normalizedHost === APEX_HOST;
  const pathNeedsRedirect = targetPath !== pathname;

  if (!hostNeedsRedirect && !pathNeedsRedirect) return null;

  return {
    location: `${SITE_URL}${targetPath}${search ?? ""}`,
    status: 301,
  };
}
