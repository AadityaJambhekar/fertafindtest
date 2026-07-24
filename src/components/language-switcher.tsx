import { useLocale } from "@/components/locale-context";
import { SUPPORTED_LOCALES, UI_TRANSLATIONS_READY, type Locale } from "@/lib/i18n";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

const LOCALE_FULL_NAME: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
};

/**
 * Switches the active language in place.
 *
 * Deliberately NOT a link or a navigation: changing the locale only updates context, so the
 * current route, query parameters, Analyze wizard step, form values, uploaded files, map
 * state and selected goal all survive the switch untouched.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  // Hidden until the curated UI dictionaries exist — see UI_TRANSLATIONS_READY.
  if (!UI_TRANSLATIONS_READY) return null;

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-border p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LOCALES.map((option) => {
        const selected = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={selected}
            aria-label={LOCALE_FULL_NAME[option]}
            title={LOCALE_FULL_NAME[option]}
            onClick={() => setLocale(option)}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {LOCALE_LABEL[option]}
          </button>
        );
      })}
    </div>
  );
}
