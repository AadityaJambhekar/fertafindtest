import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, localePath, readSavedLocale, shouldRedirectUnprefixed } from "@/lib/i18n";

/**
 * Catch-all for legacy unprefixed URLs that are deeper than one segment
 * (`/guides/...`, `/compare/...`, `/methodology/...`, `/suppliers/nanofert`).
 *
 * Single-segment legacy URLs (`/analyze`) are absorbed by the `/$locale` param instead and
 * redirected there. Either way a visitor makes exactly ONE hop to a localized URL.
 *
 * The redirect target always starts with a valid locale segment, so it matches `/$locale/...`
 * on the next pass and can never bounce back here.
 */
export const Route = createFileRoute("/$")({
  beforeLoad: ({ location }) => {
    // Already localized but unmatched -> a real 404. Redirecting would rebuild the same URL
    // and loop forever.
    if (!shouldRedirectUnprefixed(location.pathname)) throw notFound();

    const saved = typeof window === "undefined" ? null : readSavedLocale(window.localStorage);
    throw redirect({
      href: `${localePath(saved ?? DEFAULT_LOCALE, location.pathname)}${location.searchStr ?? ""}`,
      replace: true,
    });
  },
});
