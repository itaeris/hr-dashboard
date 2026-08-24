import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · HR Recruitment",
  openGraph: {
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
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const allowed = error && error in { domain: 1, oauth: 1, config: 1, denied: 1 } ? error : undefined;
  return <LoginForm oauthError={allowed} />;
}
