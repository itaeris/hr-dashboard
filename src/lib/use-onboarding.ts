"use client";

import {
  loadOnboardingRequests,
  loadOnboardingSettings,
  saveOnboardingRequest,
  saveOnboardingSettings,
  type OnboardingRequest,
  type OnboardingSettings,
} from "@/lib/onboarding";
import type { CompanySlug } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export function useOnboarding(slug: CompanySlug) {
  const [settings, setSettings] = useState<OnboardingSettings | null>(null);
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedSlug, setLoadedSlug] = useState(slug);

  if (loadedSlug !== slug) {
    setLoadedSlug(slug);
    setSettings(null);
    setRequests([]);
    setLoading(true);
  }

  const reload = useCallback(async () => {
    const [nextSettings, nextRequests] = await Promise.all([
      loadOnboardingSettings(slug),
      loadOnboardingRequests(slug),
    ]);
    setSettings(nextSettings);
    setRequests(nextRequests);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    let live = true;
    void Promise.all([loadOnboardingSettings(slug), loadOnboardingRequests(slug)]).then(
      ([nextSettings, nextRequests]) => {
        if (!live) return;
        setSettings(nextSettings);
        setRequests(nextRequests);
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [slug]);

  const saveSettings = useCallback(
    async (next: OnboardingSettings) => {
      const saved = await saveOnboardingSettings(slug, next);
      setSettings(saved);
      return saved;
    },
    [slug],
  );

  const saveRequest = useCallback(async (row: OnboardingRequest) => {
    const saved = await saveOnboardingRequest(row);
    setRequests((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, []);

  return { settings, requests, loading, reload, saveSettings, saveRequest };
}
