import { PwaRegister } from "@/components/pwa-register";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HR Recruitment",
  applicationName: "HR Recruitment",
  description:
    "Recruitment dashboard for Aeris Beaute and From This Island.",
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
