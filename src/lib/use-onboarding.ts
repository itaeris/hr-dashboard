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
    setLoading(true);
    void reload();
  }, [reload]);

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
