// Locale routing guarantees: single-hop redirects, no loops, preserved query strings,
// and the invariant that a language switch never changes the page or the wizard step.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  localePath,
  stripLocale,
  segmentToLocale,
  shouldRedirectUnprefixed,
} from "./i18n.ts";

/** What the `$locale` layout and `$` splat compute when redirecting an unprefixed URL. */
function redirectTarget(pathname: string, saved: string | null, search = "") {
  const locale = (saved && segmentToLocale(saved)) || DEFAULT_LOCALE;
  return `${localePath(locale, pathname)}${search}`;
}

test("an unprefixed URL redirects to a locale-prefixed one in a single hop", () => {
  for (const path of ["/", "/analyze", "/suppliers", "/guides/fertilizer-cost-per-acre"]) {
    const target = redirectTarget(path, null);
    assert.equal(stripLocale(target).locale, DEFAULT_LOCALE, `${path} lands on a locale`);
    assert.equal(stripLocale(target).path, path, `${path} keeps its path`);
  }
});

test("a redirect target never needs a second redirect — no loops", () => {
  for (const path of ["/", "/analyze", "/suppliers/nanofert"]) {
    const first = redirectTarget(path, null);
    // The layout only redirects when the first segment is NOT a locale.
    assert.ok(segmentToLocale(first.split("/")[1]), `${first} already has a valid locale`);
    // Applying the rule again is a no-op.
    assert.equal(redirectTarget(stripLocale(first).path, null), first);
  }
});

test("a path that already has a valid locale is never redirected again", () => {
  // Regression: the splat used to re-prefix an already-localized unknown path, producing a
  // redirect to the identical URL — an infinite loop for any 404 under /en or /pt-br.
  for (const path of ["/en/does-not-exist", "/pt-br/nope", "/en/deep/missing/page"]) {
    assert.ok(shouldRedirectUnprefixed(path) === false, `${path} must 404, not redirect`);
  }
  for (const path of ["/analyze", "/guides/x", "/xx/analyze"]) {
    assert.ok(shouldRedirectUnprefixed(path) === true, `${path} must redirect once`);
  }
});

test("a saved preference decides the redirect locale", () => {
  assert.equal(redirectTarget("/analyze", "pt-BR"), "/pt-br/analyze");
  assert.equal(redirectTarget("/analyze", "en"), "/en/analyze");
  // A corrupt saved value must not break the redirect.
  assert.equal(redirectTarget("/analyze", "klingon"), "/en/analyze");
});

test("redirects preserve the query string", () => {
  assert.equal(
    redirectTarget("/suppliers", "pt-BR", "?relationship=partner"),
    "/pt-br/suppliers?relationship=partner",
  );
});

test("switching locale keeps the same page and query string", () => {
  // This is exactly what LocaleProvider.setLocale computes.
  const switchTo = (locale: (typeof SUPPORTED_LOCALES)[number], pathname: string, search: string) =>
    `${localePath(locale, stripLocale(pathname).path)}${search}`;

  assert.equal(switchTo("pt-BR", "/en/analyze", "?step=2"), "/pt-br/analyze?step=2");
  assert.equal(switchTo("en", "/pt-br/suppliers", ""), "/en/suppliers");
  // The bare path is identical across locales — the user never changes page.
  for (const path of ["/analyze", "/suppliers", "/resources"]) {
    const en = stripLocale(switchTo("en", localePath("pt-BR", path), "")).path;
    const pt = stripLocale(switchTo("pt-BR", localePath("en", path), "")).path;
    assert.equal(en, path);
    assert.equal(pt, path);
  }
});

// --- structural guarantees the wizard depends on ---

const analyzeSource = () =>
  readFileSync(new URL("../routes/$locale.analyze.tsx", import.meta.url), "utf8");

test("the Analyze route is not keyed or remounted on the locale param", () => {
  const src = analyzeSource();
  // A `key` tied to the locale, or a remountDeps including it, would throw away wizard state
  // on every language switch — the exact regression this release must not reintroduce.
  assert.ok(!/remountDeps/.test(src), "analyze must not declare remountDeps");
  assert.ok(!/key=\{[^}]*locale/.test(src), "analyze must not key its component on the locale");
});

test("no effect resets the wizard step when the locale changes", () => {
  const src = analyzeSource();
  // setStep(0) may only ever appear as the initial useState value, never inside an effect.
  const resets = [...src.matchAll(/setStep\(\s*0\s*\)/g)];
  assert.equal(resets.length, 0, "nothing may force the wizard back to the Location step");
});

test("every goal option is a plain button that only sets the goal", () => {
  const src = analyzeSource();
  for (const value of ["yield", "cost", "balanced"]) {
    assert.ok(src.includes(`value: "${value}"`), `${value} goal option exists`);
  }
  assert.ok(
    src.includes("onClick={() => setDecisionGoal(value)}"),
    "goal click only sets the goal",
  );
  assert.ok(!/<form/.test(src), "no form element can submit and reset the wizard");
});
