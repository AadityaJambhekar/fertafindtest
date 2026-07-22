// Browser glue for analytics. Loading is fully gated on an environment variable:
// when VITE_GA_MEASUREMENT_ID is absent, every export below is a no-op and no
// third-party script is loaded. No large dependency is added — this uses the
// standard gtag snippet only when configured.
//
// Privacy: events carry only an allowlisted { page_path, source_category }. Farm
// addresses, quote values, uploaded filenames, and nutrient plans are never sent.

import { detectAiReferral, sanitizeAnalyticsParams } from "./analytics-core.ts";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  string | undefined;

export type AnalyticsEvent =
  "analyze_start" | "analyze_complete" | "recommendation_view" | "ai_referral";

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

function analyticsWindow(): AnalyticsWindow | null {
  return typeof window === "undefined" ? null : (window as AnalyticsWindow);
}

export function analyticsEnabled(): boolean {
  return analyticsWindow() !== null && Boolean(MEASUREMENT_ID);
}

let started = false;

export function initAnalytics(): void {
  const win = analyticsWindow();
  if (!win || !MEASUREMENT_ID || started) return;
  started = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  win.dataLayer = win.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    win.dataLayer!.push(args);
  };
  win.gtag = gtag;
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
}

export function track(
  event: AnalyticsEvent,
  params: { page_path?: string; source_category?: string } = {},
): void {
  const win = analyticsWindow();
  if (!win || !MEASUREMENT_ID) return;
  win.gtag?.("event", event, sanitizeAnalyticsParams(params));
}

/** Run once on first client load: initialise analytics and record an AI referral if present. */
export function bootstrapAnalytics(): void {
  const win = analyticsWindow();
  if (!win) return;
  initAnalytics();
  const utmSource = new URLSearchParams(win.location.search).get("utm_source");
  const category = detectAiReferral(document.referrer, utmSource);
  if (category) {
    track("ai_referral", {
      source_category: category,
      page_path: win.location.pathname,
    });
  }
}
