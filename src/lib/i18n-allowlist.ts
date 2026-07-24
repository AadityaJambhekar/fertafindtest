// Untranslated-terms allowlist — the documented, single source of truth for text that MUST
// survive verbatim in every locale because translating it would be wrong or would corrupt a
// source-document fact.
//
// Rule of thumb: translate PROSE; never translate identity or data. A Brazilian Portuguese page
// still says "FertaFind", "Urea", "46-0-0", "BRL" and "kg/ha" exactly as English does.
//
// Enforced by i18n-residual.test.ts (proper nouns must appear verbatim in every locale) and
// relied on by dictionaries.test.ts.

/** Brand and company identities. Never translated, never localized. */
export const PROPER_NOUNS = [
  "FertaFind",
  "FertiExpress Group",
  "Nanofert",
  "KAP Organic Agro",
  "OpenStreetMap",
  "Google",
] as const;

/**
 * Technical terms that are source-document facts. These are NOT exhaustively enumerated in the
 * UI dictionaries (they come from uploaded quotes at runtime), but they document the intent and
 * back the patterns below.
 *   - Product / model names: "Urea", "Nano Urea", "MAP", "DAP", "UAN", "KCL", "SSP", "IFFCO"
 *   - Currencies: currency codes (BRL, USD) and symbols (R$, $)
 *   - Units: kg, t, ha, ac, L, mL, kg/ha, L/ha, lb/ac, ppm, cmol(+)/kg
 */
export const TECHNICAL_TERM_EXAMPLES = [
  "Urea",
  "Nano Urea",
  "MAP",
  "DAP",
  "KCL",
  "BRL",
  "USD",
  "kg/ha",
] as const;

/** An N-P-K fertilizer grade, e.g. "46-0-0", "17-0-0", "11-52-0". Never translated or reformatted. */
export const NPK_GRADE_PATTERN = /\b\d{1,2}-\d{1,2}-\d{1,2}\b/;

/** A currency amount whose code/symbol and number must survive verbatim (never converted). */
export const CURRENCY_PATTERN = /(R\$|US\$|\$|\bBRL\b|\bUSD\b)\s?\d/;

/** Whether a token is an allowlisted proper noun that must never be translated. */
export function isProperNoun(term: string): boolean {
  return (PROPER_NOUNS as readonly string[]).includes(term);
}
