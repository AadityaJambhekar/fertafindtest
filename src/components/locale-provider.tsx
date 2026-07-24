import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LocaleContext } from "@/components/locale-context";
import { localePath, saveLocale, stripLocale, type Locale } from "@/lib/i18n";

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

/**
 * Supplies the active locale, which is owned by the URL (`/en/...`, `/pt-br/...`).
 *
 * Switching language navigates to the same page under the other locale segment, carrying the
 * query string with it. The Analyze route component is NOT keyed on the locale, so React keeps
 * the same component instance mounted across the switch and every piece of wizard state —
 * step, location, placeId, coordinates, crop, growth stage, organic certification, uploaded
 * quotes and the selected goal — survives untouched.
 */
export function LocaleProvider({
  urlLocale,
  children,
}: {
  urlLocale: Locale;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = urlLocale;
  }, [urlLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === urlLocale) return;
      // Remember the explicit choice so unprefixed URLs land here next time.
      saveLocale(browserStorage(), next);
      const { path } = stripLocale(pathname);
      navigate({ href: `${localePath(next, path)}${searchStr ?? ""}`, replace: true });
    },
    [urlLocale, pathname, searchStr, navigate],
  );

  const value = useMemo(() => ({ locale: urlLocale, setLocale }), [urlLocale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
