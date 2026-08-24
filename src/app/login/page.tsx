import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · HR Recruitment",
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
