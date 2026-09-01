import { PwaRegister } from "@/components/pwa-register";
import { publicSiteUrl } from "@/lib/auth/google";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const site = publicSiteUrl();
const description =
  "Recruitment dashboard for Aeris Beaute and From This Island.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "HR Recruitment",
  applicationName: "HR Recruitment",
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "HR Recruitment",
    title: "HR Recruitment",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HR Recruitment · Aeris Beaute and From This Island",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HR Recruitment",
    description,
    images: ["/twitter-image"],
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
