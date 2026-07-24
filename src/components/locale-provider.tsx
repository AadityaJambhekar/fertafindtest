import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleContext } from "@/components/locale-context";
import {
  DEFAULT_LOCALE,
  readSavedLocale,
  resolveLocale,
  saveLocale,
  type Locale,
} from "@/lib/i18n";

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

/**
 * Holds the active locale.
 *
 * The first render is always DEFAULT_LOCALE so the server and client markup match; the
 * saved/browser preference is applied in an effect straight after hydration. Browser
 * language only seeds the initial value — it never triggers a redirect.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const resolved = resolveLocale({
      saved: readSavedLocale(browserStorage()),
      acceptLanguage: typeof navigator === "undefined" ? null : navigator.languages?.join(","),
    });
    setLocaleState(resolved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    // An explicit choice is persisted and wins over browser detection from now on.
    saveLocale(browserStorage(), next);
    setLocaleState(next);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
