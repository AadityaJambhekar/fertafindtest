import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PAGES, canonicalUrl, type PageKey } from "./seo.ts";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const PAGE_KEYS: PageKey[] = ["home", "analyze", "terms"];

// Files that make up the public marketing surface. Claims here must stay truthful.
const MARKETING_FILES = [
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/about.tsx",
  "src/routes/analyze.tsx",
  "src/routes/suppliers.tsx",
  "src/routes/terms.tsx",
  "src/components/site-header.tsx",
];

const BANNED_CLAIMS = [
  /highest[\s-]?roi/i,
  /\broi\b/i,
  /save (you )?money/i,
  /lift your yield/i,
  /more yield per dollar/i,
  /stop overpaying/i,
  /best[\s-]?value/i,
  /guaranteed savings/i,
  /guaranteed (yield|return)/i,
  /\d+\s*%\s*(average\s*)?savings/i,
];

function locs(sitemap: string): string[] {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

test("sitemap.xml lists exactly the public routes on the www host", () => {
  const found = new Set(locs(read("public/sitemap.xml")));
  const expected = new Set(PAGE_KEYS.map((k) => canonicalUrl(PAGES[k].path)));
  assert.deepEqual(found, expected);
});

test("every sitemap URL uses the approved www host", () => {
  for (const loc of locs(read("public/sitemap.xml"))) {
    assert.ok(
      loc.startsWith("https://www.fertafind.com"),
      `${loc} uses www host`,
    );
  }
});

test("sitemap has no trailing slash except the homepage and excludes /results", () => {
  for (const loc of locs(read("public/sitemap.xml"))) {
    if (loc === "https://www.fertafind.com/") continue;
    assert.ok(!loc.endsWith("/"), `${loc} has no trailing slash`);
    assert.ok(!/\/results/.test(loc), "results pages excluded from sitemap");
  }
});

test("robots.txt points at the www sitemap and never the apex host", () => {
  const robots = read("public/robots.txt");
  assert.match(
    robots,
    /Sitemap:\s*https:\/\/www\.fertafind\.com\/sitemap\.xml/,
  );
  assert.match(robots, /User-agent:/i);
  assert.ok(
    !/\/\/fertafind\.com/.test(robots),
    "robots.txt must not reference the apex host",
  );
});

test("no unsupported marketing claim remains in the public surface", () => {
  for (const file of MARKETING_FILES) {
    const text = read(file);
    for (const re of BANNED_CLAIMS) {
      assert.ok(!re.test(text), `${file} still contains banned claim ${re}`);
    }
  }
});

test("the customer-specific results page carries a server-friendly noindex, nofollow", () => {
  const results = read("src/routes/results.$id.tsx");
  assert.match(results, /noindex,\s*nofollow/);
});

test("the SSR entry wires host/partners canonicalisation and the results X-Robots-Tag", () => {
  const server = read("src/server.ts");
  assert.match(server, /computeRedirect/);
  assert.match(server, /X-Robots-Tag/);
});

test("no analytics id or verification token is hardcoded in committed source", () => {
  const files = [
    ...MARKETING_FILES,
    "src/lib/analytics.ts",
    "src/lib/analytics-core.ts",
  ];
  const secretPatterns = [
    /\bG-[A-Z0-9]{6,}\b/,
    /\bUA-\d{4,}-\d+\b/,
    /\bGTM-[A-Z0-9]{4,}\b/,
  ];
  for (const file of files) {
    const text = read(file);
    for (const re of secretPatterns) {
      assert.ok(
        !re.test(text),
        `${file} contains a hardcoded analytics id ${re}`,
      );
    }
  }
});

test("search-engine verification is environment-driven, not a literal token", () => {
  const root = read("src/routes/__root.tsx");
  assert.match(root, /import\.meta\.env\.VITE_GOOGLE_SITE_VERIFICATION/);
  assert.match(root, /import\.meta\.env\.VITE_BING_SITE_VERIFICATION/);
});

test("analytics is loaded only when its environment variable is present", () => {
  const analytics = read("src/lib/analytics.ts");
  assert.match(analytics, /import\.meta\.env\.VITE_GA_MEASUREMENT_ID/);
});
