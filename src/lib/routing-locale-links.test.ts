// Guards the locale-segment link regression.
//
// TanStack `<Link to="/$locale...">` substitutes the `$locale` param verbatim into the URL,
// so the param MUST be the URL segment ("en" / "pt-br" / "es") — never the locale tag from
// useLocale() ("en" / "pt-BR" / "es-419"). Passing the raw tag produced `/pt-BR/...`
// (non-canonical, case-only duplicate) and `/es-419/...`, which is not a real segment and
// 404s via the unprefixed-redirect fallback — breaking the header, footer and CTA navigation
// on every Spanish page. Every such Link must resolve its param through the URL segment.

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dirs = ["../routes", "../components"];

function tsxFilesWithLocaleLinks(): Array<{ file: string; source: string }> {
  const out: Array<{ file: string; source: string }> = [];
  for (const dir of dirs) {
    const base = fileURLToPath(new URL(dir, import.meta.url));
    for (const name of readdirSync(base)) {
      if (!name.endsWith(".tsx")) continue;
      const source = readFileSync(`${base}/${name}`, "utf8");
      if (source.includes('to="/$locale')) out.push({ file: `${dir}/${name}`, source });
    }
  }
  return out;
}

test("no customer-facing Link passes the raw locale TAG as the $locale URL param", () => {
  const offenders: string[] = [];
  for (const { file, source } of tsxFilesWithLocaleLinks()) {
    // The raw tag would be handed straight through as `params={{ locale }}` or
    // `params={{ locale, slug: ... }}` — i.e. `locale` immediately followed by `}` or `,`.
    // The segment form (`locale: localeSegment` / `locale: localeToSegment(...)`) has a `:`
    // after `locale` and is what belongs in a URL.
    if (/params=\{\{\s*locale\s*[,}]/.test(source)) offenders.push(file);
    // A <Link> whose `to` is a bare, non-locale path (e.g. `to={supplierPath(...)}` ->
    // "/suppliers/x", or `to="/analyze"`) drops the active locale: the $locale layout then
    // redirects to the SAVED-or-default locale, silently sending an es/pt-br visitor to /en.
    // Every customer Link must target the `/$locale/...` route id.
    if (/to=\{supplierPath\(/.test(source)) offenders.push(`${file} (Link to={supplierPath})`);
    if (/<Link[\s\S]{0,80}?to="\/(?!\$locale)/.test(source)) {
      offenders.push(`${file} (Link to a non-$locale path)`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `These files pass the locale tag (e.g. "es-419") where a URL segment ("es") is required: ${offenders.join(", ")}`,
  );
});

test("at least one route actually uses the segment form (sanity: the pattern exists)", () => {
  const sources = tsxFilesWithLocaleLinks();
  assert.ok(sources.length > 0, "expected some $locale Link routes to exist");
  const anySegment = sources.some(
    ({ source }) => /localeSegment/.test(source) || /localeToSegment\(/.test(source),
  );
  assert.ok(anySegment, "expected the segment-based param form to be used");
});
