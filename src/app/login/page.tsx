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
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-x-clip bg-[#F4EEE6] px-4 py-8 text-ink sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />
      <div className="relative w-full">
        <LoginForm oauthError={error} />
        <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted">
          Two roles: Admin manages access, HR runs the daily pipeline. New Google
          logins start as HR.
        </p>
      </div>
    </div>
  );
}
