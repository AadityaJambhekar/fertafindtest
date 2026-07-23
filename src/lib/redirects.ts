// Pure request-canonicalisation logic, shared by the SSR server entry.
//
// Two permanent (301) redirects are enforced:
//   1. Apex host -> www host (canonical host is https://www.fertafind.com).
//   2. /partners -> /suppliers?relationship=partner (the partner content now lives
//      in the unified Supplier Network; redirect straight to the partner-filtered
//      directory in a single hop).
//
// The logic is deliberately narrow so it can never loop: the www host and the
// /suppliers target are terminal (/suppliers never redirects), and preview/local
// hosts are left untouched.

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

export function computeRedirect({ host, pathname, search }: RedirectInput): RedirectResult | null {
  // /partners collapses straight to the partner-filtered Supplier Network in a
  // single hop, on any host — /suppliers itself never redirects, so this is terminal.
  if (pathname === "/partners" || pathname === "/partners/") {
    return { location: `${SITE_URL}/suppliers?relationship=partner`, status: 301 };
  }

  // Apex (non-www) host -> canonical www host, preserving the path and query.
  if ((host ?? "").toLowerCase().split(":")[0] === APEX_HOST) {
    return { location: `${SITE_URL}${pathname}${search ?? ""}`, status: 301 };
  }

  return null;
}
