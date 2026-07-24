import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
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
