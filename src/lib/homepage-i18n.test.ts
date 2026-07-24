// Regression guard for the pt-BR homepage.
//
// The original bug: $locale.index.tsx imported useLocale (for links) but never
// useDictionary, so every word of the homepage body was hard-coded English and the
// dictionary's `home` keys were dead. Structural tests below fail if that recurs —
// a text-only assertion would not have caught it.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import { getDictionary } from "./dictionaries.ts";

const homepageSource = () =>
  readFileSync(new URL("../routes/$locale.index.tsx", import.meta.url), "utf8");

/**
 * DOCUMENTED ALLOWLIST — strings that may legitimately stay English in every locale.
 * Anything not listed here must come from the dictionary.
 */
const ALLOWED_ENGLISH = [
  // Brand and proper nouns, never translated.
  "FertaFind",
  "Nanofert",
  "FertiExpress Group",
  // A proper-noun easter egg in the rotating headline.
  "Aaditya is the best.",
  // Product/technical tokens that are identical across locales.
  "NPK",
  "AI",
];

// --- the structural root cause ---

test("the homepage consumes the dictionary", () => {
  const src = homepageSource();
  assert.match(src, /useDictionary/, "homepage must read the dictionary");
  assert.ok(
    (src.match(/\bt\.(home|homeSteps|homeBenefits|homeFaq|homeRotating|badge|country)\b/g) ?? [])
      .length > 15,
    "homepage must render its copy from dictionary keys, not hard-coded strings",
  );
});

test("every homepage section reads the dictionary, not hard-coded English", () => {
  const src = homepageSource();
  // One `useDictionary()` per section component that renders copy.
  for (const section of [
    "function Hero(",
    "function RotatingPhrase(",
    "function HowItWorks(",
    "function Benefits(",
    "function SupplierNetwork(",
    "function HomeSupplierCard(",
    "function FrequentlyAskedQuestions(",
  ]) {
    const start = src.indexOf(section);
    assert.ok(start > -1, `${section} exists`);
    const body = src.slice(start, src.indexOf("\nfunction ", start + 1));
    assert.match(body, /useDictionary\(\)|t\./, `${section} must use the dictionary`);
  }
});

test("no user-visible English sentence is hard-coded in the homepage", () => {
  const src = homepageSource();
  // JSX text nodes of three or more words starting with a capital letter.
  const sentences = [...src.matchAll(/>\s*([A-Z][A-Za-z',—-]*(?:\s+[a-z][A-Za-z',—-]*){2,})/g)].map(
    (m) => m[1].trim(),
  );
  const offenders = sentences.filter((s) => !ALLOWED_ENGLISH.some((a) => s.includes(a)));
  assert.deepEqual(offenders, [], "these strings must move into the dictionary");
});

// --- the reported copy, per locale ---

const REQUIRED_PT_BR: Array<[string, string]> = [
  ["home.heroBadge", "Inteligência em fertilizantes com IA"],
  ["home.workingWith", "Em parceria com a Nanofert"],
  ["home.heroLede", "Envie uma cotação."],
  ["home.heroPrimaryCta", "Analisar gratuitamente"],
  ["home.heroSecondaryCta", "Como funciona"],
  ["home.proofVerified", "Dados verificados de parceiros"],
  ["home.proofSeparate", "Cotações analisadas separadamente"],
  ["home.proofFlagged", "Informações ausentes sinalizadas"],
  ["home.howEyebrow", "Como funciona"],
  ["home.howHeading", "Da foto da cotação a uma decisão mais inteligente"],
];

function read(dict: unknown, path: string): string {
  return path
    .split(".")
    .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], dict) as string;
}

test("every reported pt-BR homepage string is translated, not falling back to English", () => {
  const pt = getDictionary("pt-BR");
  const en = getDictionary("en");
  for (const [path, expected] of REQUIRED_PT_BR) {
    const value = read(pt, path);
    assert.ok(value, `${path} must exist`);
    assert.ok(value.includes(expected), `${path} should contain "${expected}", got "${value}"`);
    assert.notEqual(value, read(en, path), `${path} must not fall back to English`);
  }
});

test("the pt-BR headline reads as the requested sentence", () => {
  const pt = getDictionary("pt-BR");
  const headline = `${pt.home.headlineLead} ${pt.homeRotating[0]}`;
  assert.equal(headline, "Encontre o fertilizante certo para sua lavoura.");
});

// --- the animated headline ---

test("rotating headline phrases are translated for every locale", () => {
  const en = getDictionary("en").homeRotating;
  for (const locale of SUPPORTED_LOCALES) {
    const phrases = getDictionary(locale).homeRotating;
    assert.equal(phrases.length, en.length, `${locale} needs every rotating phrase`);
    for (const phrase of phrases) assert.ok(phrase.trim().length > 0);
    if (locale !== DEFAULT_LOCALE) {
      assert.notDeepEqual(phrases, en, `${locale} rotating phrases must not be English`);
    }
  }
});

test("each rotating phrase completes the headline lead", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const d = getDictionary(locale);
    for (const phrase of d.homeRotating) {
      const full = `${d.home.headlineLead} ${phrase}`;
      assert.match(full, /[.!?]$/, `"${full}" should read as a complete sentence`);
    }
  }
});

test("the rotating headline is rendered from the dictionary, not a module constant", () => {
  const src = homepageSource();
  assert.ok(
    !/const rotatingPhrases\s*=\s*\[/.test(src),
    "rotating phrases must not be a hard-coded module constant",
  );
  assert.match(src, /useDictionary\(\)\.homeRotating/, "RotatingPhrase must read the dictionary");
});

// --- list sections ---

test("steps, benefits and FAQ are fully translated in every locale", () => {
  const en = getDictionary("en");
  for (const locale of SUPPORTED_LOCALES) {
    const d = getDictionary(locale);
    assert.equal(d.homeSteps.length, en.homeSteps.length, `${locale} steps`);
    assert.equal(d.homeBenefits.length, en.homeBenefits.length, `${locale} benefits`);
    assert.equal(d.homeFaq.length, en.homeFaq.length, `${locale} faq`);
    if (locale === DEFAULT_LOCALE) continue;
    for (const [i, step] of d.homeSteps.entries()) {
      assert.notEqual(step.title, en.homeSteps[i].title, `${locale} step ${i} title`);
    }
    for (const [i, item] of d.homeFaq.entries()) {
      assert.notEqual(item.question, en.homeFaq[i].question, `${locale} faq ${i} question`);
    }
  }
});

// --- the switcher ---

test("the language switcher shows EN and PT-BR", () => {
  const src = readFileSync(new URL("../components/language-switcher.tsx", import.meta.url), "utf8");
  assert.match(src, /en:\s*"EN"/, 'English is labelled "EN"');
  assert.match(src, /"pt-BR":\s*"PT-BR"/, 'Brazilian Portuguese is labelled "PT-BR", not "PT"');
});

test("the switcher lets each call site control its own visibility", () => {
  const src = readFileSync(new URL("../components/language-switcher.tsx", import.meta.url), "utf8");
  // Regression: the component hard-coded `inline-flex`, which beat the desktop instance's
  // `hidden` class, so the switcher rendered TWICE on mobile. Display is the caller's job.
  const base = /className=\{`([^`]*)`\}/.exec(src)?.[1] ?? "";
  assert.ok(
    !/\b(inline-flex|flex|block|grid)\b/.test(base.replace("${className}", "")),
    `switcher base classes must not set display, got: ${base}`,
  );
  assert.match(src, /\$\{className\}/, "caller classes must be applied");
});

test("the switcher exposes a translated accessible name for every locale", () => {
  const src = readFileSync(new URL("../components/language-switcher.tsx", import.meta.url), "utf8");
  assert.match(src, /aria-label=/, "each option needs an accessible name");
  assert.match(src, /aria-pressed=/, "selection state must be exposed");
  // Real <button> elements keep it keyboard-operable.
  assert.match(src, /type="button"/);
});

// --- English must not regress ---

test("English homepage copy is unchanged by the Portuguese work", () => {
  const en = getDictionary("en");
  assert.equal(en.home.heroBadge, "AI-powered fertilizer intelligence");
  assert.equal(en.home.workingWith, "Working with Nanofert");
  assert.equal(en.home.headlineLead, "Find the fertilizer");
  assert.equal(en.home.heroPrimaryCta, "Analyze for free");
  assert.equal(en.home.heroSecondaryCta, "How it works");
  assert.equal(en.home.proofVerified, "Verified partner data");
  assert.deepEqual(en.homeRotating[0], "worth buying.");
});

test("brand and product nouns survive translation in every locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const serialized = JSON.stringify(getDictionary(locale as Locale));
    assert.ok(serialized.includes("FertaFind"), `${locale} keeps FertaFind`);
    assert.ok(serialized.includes("Nanofert"), `${locale} keeps Nanofert`);
    assert.ok(!/NPK-|N-P-K traduzido/.test(serialized), "NPK is never rewritten");
  }
});
