"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function turnstileEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

export function TurnstileWidget({
  name = "cf-turnstile-response",
  resetSignal = 0,
  onToken,
}: {
  name?: string;
  resetSignal?: string | number;
  onToken?: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const hostId = useId().replace(/:/g, "");
  const widgetId = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;

    function setToken(token: string) {
      if (inputRef.current) inputRef.current.value = token;
      onTokenRef.current?.(token);
    }

    function mount() {
      const host = document.getElementById(hostId);
      if (!host || !window.turnstile) return;
      if (widgetId.current) {
        window.turnstile.reset(widgetId.current);
        setToken("");
        return;
      }
      widgetId.current = window.turnstile.render(host, {
        sitekey: siteKey,
        theme: "light",
        size: "flexible",
        callback: (token: string) => setToken(token),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    }

    mount();
    window.addEventListener("turnstile-load", mount);
    return () => {
      window.removeEventListener("turnstile-load", mount);
    };
  }, [hostId, resetSignal, siteKey]);

  useEffect(() => {
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = "";
      }
    };
  }, []);

  if (!siteKey) return null;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <input ref={inputRef} type="hidden" name={name} defaultValue="" />
      <div id={hostId} className="min-h-[65px]" />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => window.dispatchEvent(new Event("turnstile-load"))}
      />
    </div>
  );
}
