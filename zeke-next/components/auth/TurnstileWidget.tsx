"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "dark";
      size: "flexible";
      appearance: "always";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  action: "login" | "register" | "password_reset";
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
  resetKey: number;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  action,
  onVerify,
  onExpire,
  onError,
  resetKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });

  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  }, [onVerify, onExpire, onError]);

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!container || !turnstile || !SITE_KEY || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(container, {
      sitekey: SITE_KEY,
      action,
      theme: "dark",
      size: "flexible",
      appearance: "always",
      callback: (token) => callbacksRef.current.onVerify(token),
      "expired-callback": () => callbacksRef.current.onExpire(),
      "error-callback": () => callbacksRef.current.onError(),
    });
  }, [action]);

  useEffect(() => {
    renderWidget();
    const intervalId = window.setInterval(() => {
      if (widgetIdRef.current) {
        window.clearInterval(intervalId);
        return;
      }
      renderWidget();
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [renderWidget]);

  useEffect(() => {
    if (!resetKey || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  useEffect(
    () => () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    },
    [],
  );

  if (!SITE_KEY) {
    return (
      <div role="alert" className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
        Security check is temporarily unavailable. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex min-h-[70px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-dark/40">
      <div ref={containerRef} className="w-full" />
      <Script
        id="cloudflare-turnstile"
        src={SCRIPT_URL}
        strategy="afterInteractive"
        onReady={renderWidget}
        onError={() => callbacksRef.current.onError()}
      />
    </div>
  );
}
