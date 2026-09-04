import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/email/send": [
      "./public/logo/aerisbeaute/Aeris new logo-01.png",
      "./public/logo/fti/FA_FromThisIsland_Charcoal.png",
    ],
    "/opengraph-image": [
      "./public/logo/aerisbeaute/Aeris new logo-white-01.png",
      "./public/logo/fti/FTI_Logogram_White.png",
    ],
    "/twitter-image": [
      "./public/logo/aerisbeaute/Aeris new logo-white-01.png",
      "./public/logo/fti/FTI_Logogram_White.png",
    ],
    "/login/opengraph-image": [
      "./public/logo/aerisbeaute/Aeris new logo-white-01.png",
      "./public/logo/fti/FTI_Logogram_White.png",
    ],
    "/login/twitter-image": [
      "./public/logo/aerisbeaute/Aeris new logo-white-01.png",
      "./public/logo/fti/FTI_Logogram_White.png",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://challenges.cloudflare.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://challenges.cloudflare.com",
              "frame-src 'self' blob: data: https://*.supabase.co https://challenges.cloudflare.com",
              "child-src 'self' blob: data: https://*.supabase.co https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "object-src 'self' blob: data: https://*.supabase.co",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
