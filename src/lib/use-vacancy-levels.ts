"use client";

import { loadVacancyLevels, saveVacancyLevels, DEFAULT_VACANCY_LEVELS } from "@/lib/vacancy-levels";
import { useRecruitment } from "@/lib/recruitment-context";
import { useCallback, useEffect, useState } from "react";

export function useVacancyLevels() {
  const { slug } = useRecruitment();
  const [levels, setLevels] = useState<string[]>(DEFAULT_VACANCY_LEVELS);

  useEffect(() => {
    let active = true;
    void loadVacancyLevels(slug).then((next) => {
      if (active) setLevels(next);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const save = useCallback(
    async (next: string[]) => {
      const saved = await saveVacancyLevels(slug, next);
      setLevels(saved);
      return saved;
    },
    [slug],
  );

  const addLevel = useCallback(
    async (value: string) => {
      const name = value.trim();
      if (!name) return levels;
      if (levels.some((item) => item.toLowerCase() === name.toLowerCase())) {
        return levels;
      }
      return save([...levels, name]);
    },
    [levels, save],
  );

  return { levels, save, addLevel };
}
