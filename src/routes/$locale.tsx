import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LocaleProvider } from "@/components/locale-provider";
import { DEFAULT_LOCALE, localePath, readSavedLocale, segmentToLocale } from "@/lib/i18n";

/**
 * Locale segment layout.
 *
 * Every customer page lives beneath this route, so the locale is part of the URL and each
 * language has its own indexable address.
 *
 * When the first segment is NOT a supported locale, the URL is an old unprefixed one
 * (`/analyze`, `/suppliers`) whose first segment happened to land in this param. It is
 * redirected ONCE to the same path under a locale — never in a loop, because the redirect
 * target always begins with a valid locale segment and so never re-enters this branch.
 */
export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params, location }) => {
    if (segmentToLocale(params.locale)) return;

    // Prefer an explicit saved choice; otherwise English. Browser language is deliberately
    // NOT consulted here — detection alone must never force a redirect.
    const saved = typeof window === "undefined" ? null : readSavedLocale(window.localStorage);
    throw redirect({
      href: `${localePath(saved ?? DEFAULT_LOCALE, location.pathname)}${location.searchStr ?? ""}`,
      replace: true,
    });
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  // segmentToLocale is guaranteed non-null here: beforeLoad redirected anything else away.
  return (
    <LocaleProvider urlLocale={segmentToLocale(locale) ?? DEFAULT_LOCALE}>
      <Outlet />
    </LocaleProvider>
  );
}
