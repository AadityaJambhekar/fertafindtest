import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, localePath, localeToSegment, type Locale } from "@/lib/i18n";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** The curated dictionary for the active locale. */
export function useDictionary(): Dictionary {
  return getDictionary(useLocale().locale);
}

/**
 * Builds locale-prefixed URLs for plain anchors and non-Link navigation.
 * `lp("/suppliers")` -> "/pt-br/suppliers" when Portuguese is active.
 */
export function useLocalePath(): (path: string) => string {
  const { locale } = useLocale();
  return (path: string) => localePath(locale, path);
}

/**
 * The active locale's URL SEGMENT ("en" / "pt-br" / "es"), for TanStack `<Link to="/$locale...">`
 * `params`. The `$locale` value is substituted verbatim into the URL, so it must be the segment,
 * never the tag ("pt-BR" / "es-419") that useLocale() returns — the tag yields a non-canonical
 * `/pt-BR/...` or a broken `/es-419/...` route.
 */
export function useLocaleSegment(): string {
  return localeToSegment(useLocale().locale);
}
