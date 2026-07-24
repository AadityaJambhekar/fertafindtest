// Defensive reCAPTCHA rendering, kept framework-free so it can be unit-tested with
// `node --test` and reused by the GoogleRecaptcha component.
//
// WHY THIS EXISTS: google.com/recaptcha/api.js exposes the `grecaptcha` global before
// `grecaptcha.render` is actually callable (the classic "render is not a function" race).
// Calling render() directly inside a React effect meant a throw escaped the effect and
// tore down the surrounding Analyze wizard (resetting it to the Location step). This helper
// guards the API and never throws — any failure is surfaced via onError instead.

export interface RecaptchaApi {
  execute: (widgetId: number) => void;
  render: (container: string | HTMLElement, options: Record<string, unknown>) => number;
  reset: (widgetId: number) => void;
  ready?: (cb: () => void) => void;
}

export interface RenderInvisibleOptions {
  containerId: string;
  siteKey: string;
  onToken: (token: string) => void;
  onError: (message: string) => void;
}

/**
 * Render the invisible reCAPTCHA widget. Returns the widget id, or null when the grecaptcha
 * API is unavailable / not yet ready / rendering fails. NEVER throws.
 */
export function renderInvisibleRecaptcha(
  api: RecaptchaApi | null | undefined,
  opts: RenderInvisibleOptions,
): number | null {
  if (!api || typeof api.render !== "function") return null;
  try {
    return api.render(opts.containerId, {
      sitekey: opts.siteKey,
      size: "invisible",
      badge: "bottomright",
      callback: (token: string) => opts.onToken(token),
      "expired-callback": () => opts.onError("Verification expired. Please try again."),
      "error-callback": () => opts.onError("Verification failed. Please try again."),
    });
  } catch {
    opts.onError("Verification could not start. Please try again.");
    return null;
  }
}
