// Pure request-canonicalisation logic, shared by the SSR server entry.
//
// Two permanent (301) redirects are enforced:
//   1. Apex host -> www host (canonical host is https://www.fertafind.com).
//   2. /partners -> /#partners (the partners content lives in a homepage
//      section; redirect straight to that anchor in a single hop, never via
//      /suppliers).
//
// The logic is deliberately narrow so it can never loop: the www host and the
// homepage target are terminal, and preview/local hosts are left untouched.

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
  // /partners collapses straight to the homepage Partners section in a single
  // hop, on any host — never a two-hop chain through /suppliers.
  if (pathname === "/partners" || pathname === "/partners/") {
    return { location: `${SITE_URL}/#partners`, status: 301 };
  }

  // Apex (non-www) host -> canonical www host, preserving the path and query.
  if ((host ?? "").toLowerCase().split(":")[0] === APEX_HOST) {
    return { location: `${SITE_URL}${pathname}${search ?? ""}`, status: 301 };
  }

  return null;
}
