import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

const description =
  "Recruitment dashboard for Aeris Beaute and From This Island.";

export const metadata: Metadata = {
  title: "Sign in · HR Recruitment",
  description,
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    url: "/login",
    title: "HR Recruitment",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "HR Recruitment",
    description,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const allowed =
    error && error in { domain: 1, uninvited: 1, oauth: 1, config: 1, denied: 1 }
      ? error
      : undefined;
  return <LoginForm oauthError={allowed} />;
}
