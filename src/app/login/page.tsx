import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · HR Recruitment",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[#F4EEE6] px-6 py-10 text-ink">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />
      <div className="relative w-full">
        <LoginForm />
        <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted">
          Two roles: Admin manages access, HR runs the daily pipeline.
        </p>
      </div>
    </div>
  );
}
