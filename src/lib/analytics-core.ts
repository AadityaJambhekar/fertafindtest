// Pure analytics helpers with no browser or Vite (`import.meta`) dependencies, so
// they can be unit-tested directly. The browser glue lives in `analytics.ts`.
//
// Privacy: only a coarse source category and the page path are ever recorded.
// No farm address, quote value, uploaded filename, nutrient plan, or other
// customer-entered data is captured here or forwarded downstream.

export const AI_REFERRAL_SOURCES: Array<{ category: string; hosts: string[] }> = [
  {
    category: "chatgpt",
    hosts: ["chatgpt.com", "chat.openai.com", "openai.com"],
  },
  { category: "perplexity", hosts: ["perplexity.ai"] },
  { category: "gemini", hosts: ["gemini.google.com", "bard.google.com"] },
  { category: "claude", hosts: ["claude.ai"] },
  { category: "copilot", hosts: ["copilot.microsoft.com"] },
];

function hostFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function matchHost(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

/**
 * Classify an AI-search referral from the document referrer and/or a utm_source
 * value. Returns a coarse source category (e.g. "chatgpt") or null.
 */
export function detectAiReferral(
  referrer: string | null | undefined,
  utmSource: string | null | undefined,
): string | null {
  const utm = (utmSource ?? "").toLowerCase().trim();
  if (utm) {
    for (const source of AI_REFERRAL_SOURCES) {
      if (source.hosts.some((h) => utm === h || matchHost(utm, h)) || utm === source.category) {
        return source.category;
      }
    }
  }

  const host = hostFromUrl(referrer);
  if (host) {
    for (const source of AI_REFERRAL_SOURCES) {
      if (source.hosts.some((h) => matchHost(host, h))) return source.category;
    }
  }

  return null;
}

export const ANALYTICS_PARAM_ALLOWLIST = ["page_path", "source_category"] as const;

/** Keep only non-empty string values for allowlisted keys; drop everything else. */
export function sanitizeAnalyticsParams(
  params: Record<string, unknown> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ANALYTICS_PARAM_ALLOWLIST) {
    const value = params[key];
    if (typeof value === "string" && value.trim() !== "") out[key] = value;
  }
  return out;
}
