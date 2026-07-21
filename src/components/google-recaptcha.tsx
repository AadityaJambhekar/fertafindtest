import { forwardRef, useEffect, useImperativeHandle, useId, useRef } from "react";

type RecaptchaApi = {
  execute: (widgetId: number) => void;
  render: (container: string | HTMLElement, options: Record<string, unknown>) => number;
  reset: (widgetId: number) => void;
};

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
  const siteKey = isLocalTest
    ? GOOGLE_TEST_SITE_KEY
    : import.meta.env.VITE_RECAPTCHA_SITE_KEY || GOOGLE_TEST_SITE_KEY;

  useImperativeHandle(
    ref,
    () => ({
      execute: () => {
        if (isLocalTest) {
          onVerified("LOCAL_RECAPTCHA_TEST_TOKEN");
          return true;
        }
        if (!window.grecaptcha || widgetId.current === null) return false;
        window.grecaptcha.execute(widgetId.current);
        return true;
      },
      reset: () => {
        if (window.grecaptcha && widgetId.current !== null) {
          window.grecaptcha.reset(widgetId.current);
        }
      },
    }),
    [isLocalTest, onVerified],
  );

  useEffect(() => {
    if (isLocalTest) return;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !window.grecaptcha || widgetId.current !== null) return;
      widgetId.current = window.grecaptcha.render(containerId, {
        sitekey: siteKey,
        size: "invisible",
        badge: "bottomright",
        callback: onVerified,
        "expired-callback": () => onError("Verification expired. Please try again."),
        "error-callback": () => onError("Verification failed. Please try again."),
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fertafind-recaptcha="true"]',
    );
    if (existing) {
      if (window.grecaptcha) renderWidget();
      else existing.addEventListener("load", renderWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.fertafindRecaptcha = "true";
      script.addEventListener("load", renderWidget, { once: true });
      script.addEventListener(
        "error",
        () => onError("Verification could not load. Check your connection."),
        { once: true },
      );
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [containerId, isLocalTest, onError, onVerified, siteKey]);

  return isLocalTest ? null : <div id={containerId} />;
});
