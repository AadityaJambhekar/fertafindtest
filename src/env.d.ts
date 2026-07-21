/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 measurement id. When absent, analytics stays disabled and no script loads. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Google Search Console verification token (meta-tag method). */
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
  /** Bing Webmaster Tools verification token (msvalidate.01). */
  readonly VITE_BING_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
