import { publicSiteUrl } from "@/lib/auth/google";
import type { MetadataRoute } from "next";

const origin = publicSiteUrl();

export default function manifest(): MetadataRoute.Manifest {
  const local = process.env.NODE_ENV === "development";

  return {
    name: "HR Recruitment",
    short_name: "HR",
    description: "Recruitment dashboard for Aeris Beaute and From This Island.",
    id: `${origin}/`,
    start_url: local ? "/" : `${origin}/`,
    scope: local ? "/" : `${origin}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#F7F1EA",
    theme_color: "#1C1412",
    lang: "en",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
