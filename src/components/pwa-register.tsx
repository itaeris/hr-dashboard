"use client";

import { LEGACY_ORIGINS, PRODUCTION_ORIGIN } from "@/lib/auth/google";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const origin = window.location.origin.replace(/\/$/, "");
    if (LEGACY_ORIGINS.includes(origin)) {
      const next = `${PRODUCTION_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(next);
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    document.documentElement.classList.toggle("pwa", standalone);

    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
