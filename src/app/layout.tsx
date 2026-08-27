import { PwaRegister } from "@/components/pwa-register";
import { PRODUCTION_ORIGIN } from "@/lib/auth/google";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function siteUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "HR Recruitment",
  applicationName: "HR Recruitment",
  description:
    "Recruitment dashboard for Aeris Beaute and From This Island.",
  openGraph: {
    type: "website",
    siteName: "HR Recruitment",
    title: "HR Recruitment",
    description:
      "Recruitment dashboard for Aeris Beaute and From This Island.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HR Recruitment",
    description:
      "Recruitment dashboard for Aeris Beaute and From This Island.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HR Recruitment",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#1C1412",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} min-h-full antialiased lg:h-full`}
    >
      <body className="min-h-full font-sans lg:h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
