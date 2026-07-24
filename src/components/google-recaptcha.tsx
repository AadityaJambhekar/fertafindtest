import { forwardRef, useEffect, useImperativeHandle, useId, useRef } from "react";
import { renderInvisibleRecaptcha, type RecaptchaApi } from "@/lib/recaptcha";

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

const GOOGLE_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export type GoogleRecaptchaHandle = {
  execute: () => boolean;
  reset: () => void;
};

export const GoogleRecaptcha = forwardRef<
  GoogleRecaptchaHandle,
  {
    onError: (message: string) => void;
    onVerified: (token: string) => void;
  }
>(function GoogleRecaptcha({ onError, onVerified }, ref) {
  const reactId = useId();
  const containerId = `google-recaptcha-${reactId.replace(/:/g, "")}`;
  const widgetId = useRef<number | null>(null);
  const isLocalTest = import.meta.env.DEV;

  // Hold the latest callbacks in refs so the render effect NEVER has to depend on them.
  // The parent (Analyze wizard) rebuilds these callbacks on almost every state change
  // (e.g. picking a "Your goal" option), so depending on them re-ran the effect and called
  // grecaptcha.render again mid-load — a throw there tore down the wizard. Stable deps fix that.
  const onVerifiedRef = useRef(onVerified);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onErrorRef.current = onError;
  }, [onVerified, onError]);

  const siteKey = isLocalTest
    ? GOOGLE_TEST_SITE_KEY
    : import.meta.env.VITE_RECAPTCHA_SITE_KEY || GOOGLE_TEST_SITE_KEY;

  useImperativeHandle(
    ref,
    () => ({
      execute: () => {
        if (isLocalTest) {
          onVerifiedRef.current("LOCAL_RECAPTCHA_TEST_TOKEN");
          return true;
        }
        if (!window.grecaptcha || widgetId.current === null) return false;
        try {
          window.grecaptcha.execute(widgetId.current);
          return true;
        } catch {
          return false;
        }
      },
      reset: () => {
        if (window.grecaptcha && widgetId.current !== null) {
          try {
            window.grecaptcha.reset(widgetId.current);
          } catch {
            /* ignore a reset failure */
          }
        }
      },
    }),
    [isLocalTest],
  );

  useEffect(() => {
    if (isLocalTest) return;
    let cancelled = false;

    // Render exactly once, and only once grecaptcha is truly ready. renderInvisibleRecaptcha
    // guards `render` availability and swallows any render error into onError, so nothing ever
    // throws out of this effect into React.
    const renderWidget = () => {
      if (cancelled || widgetId.current !== null) return;
      const id = renderInvisibleRecaptcha(window.grecaptcha, {
        containerId,
        siteKey,
        onToken: (token) => onVerifiedRef.current(token),
        onError: (message) => onErrorRef.current(message),
      });
      if (id !== null) widgetId.current = id;
    };

    const ready = () => {
      const api = window.grecaptcha;
      if (api && typeof api.ready === "function") api.ready(renderWidget);
      else renderWidget();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fertafind-recaptcha="true"]',
    );
    if (existing) {
      if (window.grecaptcha) ready();
      else existing.addEventListener("load", ready, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.fertafindRecaptcha = "true";
      script.addEventListener("load", ready, { once: true });
      script.addEventListener(
        "error",
        () => onErrorRef.current("Verification could not load. Check your connection."),
        { once: true },
      );
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
    // Deliberately stable: the render setup must not re-run when the parent re-renders.
  }, [containerId, isLocalTest, siteKey]);

  return isLocalTest ? null : <div id={containerId} />;
});
