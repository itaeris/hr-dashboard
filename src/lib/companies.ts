import type { CSSProperties } from "react";
import type { CompanySlug } from "./types";

export type CompanyTheme = {
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentDeep: string;
  paper: string;
  paperRaised: string;
  ink: string;
  muted: string;
  line: string;
};

export type CompanyConfig = {
  slug: CompanySlug;
  name: string;
  shortName: string;
  tagline: string;
  industry: string;
  city: string;
  founded: string;
  theme: CompanyTheme;
};

export const COMPANIES: Record<CompanySlug, CompanyConfig> = {
  "aeris-beaute": {
    slug: "aeris-beaute",
    name: "Aeris Beaute",
    shortName: "Aeris",
    tagline: "Beauty that feels like air",
    industry: "Beauty & Personal Care",
    city: "Jakarta",
    founded: "2019",
    theme: {
      accent: "#9A4A5C",
      accentHover: "#7E3C4C",
      accentSoft: "#F4E6E8",
      accentDeep: "#3F1F28",
      paper: "#F7F1EA",
      paperRaised: "#FFFCF8",
      ink: "#1C1412",
      muted: "#7A6B66",
      line: "#E8DDD4",
    },
  },
  "from-this-island": {
    slug: "from-this-island",
    name: "From This Island",
    shortName: "FTI",
    tagline: "Crafted from the archipelago",
    industry: "Skincare & Beauty",
    city: "Bali",
    founded: "2021",
    theme: {
      accent: "#1F6B64",
      accentHover: "#17554F",
      accentSoft: "#E4F0EE",
      accentDeep: "#0E2F2C",
      paper: "#F3EEE6",
      paperRaised: "#FBF8F2",
      ink: "#12201E",
      muted: "#66716E",
      line: "#E0D8CC",
    },
  },
};

export const COMPANY_LIST = Object.values(COMPANIES);

export function isCompanySlug(value: string): value is CompanySlug {
  return value === "aeris-beaute" || value === "from-this-island";
}

export function themeStyle(theme: CompanyTheme): CSSProperties {
  return {
    "--accent": theme.accent,
    "--accent-hover": theme.accentHover,
    "--accent-soft": theme.accentSoft,
    "--accent-deep": theme.accentDeep,
    "--paper": theme.paper,
    "--paper-raised": theme.paperRaised,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--line": theme.line,
  } as CSSProperties;
}
