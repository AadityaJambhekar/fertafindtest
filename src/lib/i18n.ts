// Locale model for the public site.
//
// Framework-free (no React / @/ alias / import.meta) so it can be unit-tested with
// `node --test` and imported by both the server routes and the router.
//
// Rules enforced here:
//   - Only locales with COMPLETE curated content are public. Spanish is deliberately absent.
//   - URL segments are lowercase ("/pt-br/..."); locale tags keep canonical casing ("pt-BR").
//   - Resolution priority is: explicit selection > saved preference > browser > English.
//     Browser detection alone never forces a redirect — it only seeds the default.
//   - Anything arriving from a client (query string, cookie, request body) is validated
//     against SUPPORTED_LOCALES before use; unknown values fall back to English.

import { SITE_URL } from "./seo.ts";

export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Lowercase URL segment for a locale ("pt-BR" -> "pt-br"). */
export function localeToSegment(locale: Locale): string {
  return locale.toLowerCase();
}

/** A URL segment back to its canonical locale tag, or null if unsupported. */
export function segmentToLocale(segment: string): Locale | null {
  const wanted = segment.trim().toLowerCase();
  return SUPPORTED_LOCALES.find((l) => l.toLowerCase() === wanted) ?? null;
}

/**
 * Strictly parse an untrusted value into a supported locale.
 *
 * Accepts exact tags case-insensitively ("pt-BR", "pt-br") and the bare primary
 * subtag "pt" (which the Brazilian Portuguese content serves). Everything else is
 * rejected — including region variants we have no content for.
 */
export function parseLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (raw === "") return null;
  const exact = segmentToLocale(raw);
  if (exact) return exact;
  if (raw.toLowerCase() === "pt") return "pt-BR";
  return null;
}

/** One entry of an Accept-Language header. */
interface LanguageRange {
  tag: string;
  quality: number;
}

function parseAcceptLanguage(header: string): LanguageRange[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.split(";").map((s) => s.trim());
      const q = params.find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((r) => r.tag !== "")
    .sort((a, b) => b.quality - a.quality);
}

export interface LocaleSignals {
  /** An explicit user selection (language switcher, ?lang= param). */
  explicit?: unknown;
  /** A previously saved preference (cookie / localStorage). */
  saved?: unknown;
  /** The browser's Accept-Language header. */
  acceptLanguage?: string | null;
}

/**
 * Resolve the locale from the available signals, in priority order. An unparseable
 * value at one level falls through to the next rather than short-circuiting to English,
 * so a corrupt cookie can't override a valid browser preference.
 */
export function resolveLocale(signals: LocaleSignals): Locale {
  const explicit = parseLocale(signals.explicit);
  if (explicit) return explicit;

  const saved = parseLocale(signals.saved);
  if (saved) return saved;

  if (typeof signals.acceptLanguage === "string" && signals.acceptLanguage.trim() !== "") {
    for (const range of parseAcceptLanguage(signals.acceptLanguage)) {
      if (range.quality <= 0) continue;
      const match = parseLocale(range.tag) ?? parseLocale(range.tag.split("-")[0]);
      if (match) return match;
    }
  }

  return DEFAULT_LOCALE;
}

/** Split a pathname into its locale prefix (if any) and the bare path beneath it. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, first = "", ...rest] = withSlash.split("/");
  const locale = segmentToLocale(first);
  if (!locale) return { locale: null, path: withSlash };
  const remainder = rest.join("/").replace(/\/+$/, "");
  return { locale, path: remainder === "" ? "/" : `/${remainder}` };
}

/** Prefix a path with a locale segment, replacing any locale prefix already present. */
export function localePath(locale: Locale, path: string): string {
  const { path: bare } = stripLocale(path === "" ? "/" : path);
  const segment = localeToSegment(locale);
  if (bare === "/") return `/${segment}`;
  return `/${segment}${bare}`;
}

/** The value for <html lang>. */
export function localeHtmlLang(locale: Locale): string {
  return locale;
}

/**
 * Validate a locale arriving from a client request (e.g. the quote-analysis body).
 * Never throws — an unknown locale safely degrades to English.
 */
export function validateRequestLocale(value: unknown): Locale {
  return parseLocale(value) ?? DEFAULT_LOCALE;
}

/**
 * Whether curated UI translations exist for every non-default locale.
 *
 * TRUE: the pt-BR dictionaries in dictionaries.ts cover the navigation, the Analyze wizard,
 * the supplier directory, validation, errors and empty states, and dictionaries.test.ts fails
 * the build if English gains a key a locale has not translated. Long-form editorial bodies
 * (guides, comparisons, methodology, Terms) are still English and say so via
 * notice.untranslatedArticle.
 */
export const UI_TRANSLATIONS_READY = true;

export const LOCALE_STORAGE_KEY = "fertafind:locale";

/** The subset of the Storage API we use — so it can be faked in tests. */
export interface LocaleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Read the saved preference. Returns null when absent, unparseable, or when storage
 * itself is unavailable (Safari private mode and blocked-cookie setups throw on access).
 */
export function readSavedLocale(storage: LocaleStorage | null | undefined): Locale | null {
  if (!storage) return null;
  try {
    return parseLocale(storage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persist an explicit choice. Never throws — a blocked store just means it won't stick. */
export function saveLocale(storage: LocaleStorage | null | undefined, locale: Locale): void {
  if (!storage) return;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — the in-memory selection still applies for this session */
  }
}

/** Human-readable language name for each locale, used in model instructions. */
const LOCALE_LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese",
};

/**
 * The language clause appended to the quote-analysis prompt.
 *
 * Only the model's PROSE is localized. Company names, product/model names, NPK grades,
 * numbers, currencies and units are source-document facts and must survive verbatim —
 * translating "46-0-0" or converting a BRL price would corrupt the comparison.
 */
export function aiLanguageInstruction(locale: Locale): string {
  const language = LOCALE_LANGUAGE_NAME[locale];
  return [
    `Write every explanation, reason, summary and warning in ${language}.`,
    "Do NOT translate or alter: company names, product and model names, NPK grades,",
    "numeric values, currency codes and amounts, or units of measure. Keep every number",
    "and currency exactly as it appears in the source quote — never convert a currency.",
    "Enum values and field names in the JSON response stay in English; only human-readable",
    "prose is translated.",
  ].join(" ");
}

export interface HreflangLink {
  hreflang: string;
  href: string;
}

/**
 * Reciprocal hreflang links for a page, plus x-default pointing at the English URL.
 * Accepts either a bare or an already-localized path.
 */
export function hreflangLinks(path: string): HreflangLink[] {
  const { path: bare } = stripLocale(path);
  const links: HreflangLink[] = SUPPORTED_LOCALES.map((locale) => ({
    hreflang: locale,
    href: `${SITE_URL}${localePath(locale, bare)}`,
  }));
  links.push({ hreflang: "x-default", href: `${SITE_URL}${localePath(DEFAULT_LOCALE, bare)}` });
  return links;
}
