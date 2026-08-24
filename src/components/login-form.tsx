"use client";

import { loginAction, type LoginState } from "@/app/actions/auth";
import {
  IconArrowRight,
  IconBriefcase,
  IconCalendar,
  IconGoogle,
  IconKanban,
  IconLock,
  IconMail,
  IconPeople,
} from "@/components/icons";
import { PasswordInput, fieldClass } from "@/components/ui";
import { motion } from "framer-motion";
import Image from "next/image";
import { useActionState } from "react";

const OAUTH_ERRORS: Record<string, string> = {
  domain: "Use a Google account from @aerisbeaute.com or @fromthisisland.com.",
  oauth: "Google sign-in failed. Try again.",
  config: "Google sign-in is not configured yet.",
  denied: "Google sign-in was cancelled.",
};

const HIGHLIGHTS = [
  { label: "Pipeline", icon: IconKanban },
  { label: "Progress", icon: IconPeople },
  { label: "Vacancy", icon: IconBriefcase },
  { label: "Calendar", icon: IconCalendar },
  { label: "Emails", icon: IconMail },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease },
  }),
};

const iconItem = {
  hidden: { opacity: 0, y: 10, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease },
  },
};

function dayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const error = state?.error ?? (oauthError ? OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.oauth : null);

  return (
    <div className="login-shell flex flex-col lg:grid lg:h-auto lg:min-h-dvh lg:grid-cols-2 lg:overflow-visible">
      <BrandPanel />
      <section className="relative z-10 flex min-h-0 flex-1 flex-col max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-[calc(38dvh-2rem)] sm:max-lg:top-[calc(40dvh-2rem)] lg:static lg:items-center lg:justify-center lg:bg-paper lg:px-8 lg:py-10">
        <div className="flex h-full min-h-0 flex-1 flex-col rounded-t-[32px] bg-paper-raised px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_rgba(28,20,18,0.42),0_-4px_12px_rgba(28,20,18,0.18)] lg:h-auto lg:min-h-0 lg:w-full lg:max-w-[420px] lg:flex-none lg:rounded-[28px] lg:border lg:border-white/70 lg:p-8 lg:shadow-[0_24px_60px_-32px_rgba(40,24,20,0.4)]">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line lg:hidden" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible"
          >
            <h1 className="font-display text-3xl leading-tight text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to continue to HR Recruitment
            </p>

            <form action={action} className="relative mt-7 space-y-4 lg:mt-8">
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label>
                  Company website
                  <input name="company_website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink">Email</span>
                <span className="relative block">
                  <IconMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    maxLength={254}
                    placeholder="you@aerisbeaute.com"
                    className={`${fieldClass} pl-10`}
                  />
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink">Password</span>
                <span className="relative block">
                  <IconLock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <PasswordInput
                    name="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    placeholder="••••••••"
                    className={`${fieldClass} pl-10`}
                  />
                </span>
              </label>

              {error ? (
                <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
              >
                {pending ? "Signing in…" : "Sign in"}
                {pending ? null : <IconArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
              <span className="h-px flex-1 bg-line" />
              or continue with
              <span className="h-px flex-1 bg-line" />
            </div>

            {/* OAuth must be a full document navigation, not a Next.js client transition. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition hover:border-accent"
            >
              <IconGoogle className="h-4 w-4" />
              Sign in with Google
            </a>
          </motion.div>
          <p className="mt-auto shrink-0 pt-5 text-center text-xs text-muted lg:hidden">
            Aeris Beaute · From This Island
          </p>
        </div>
      </section>
    </div>
  );
}

function BrandPanel() {
  return (
    <section className="relative flex min-h-[38dvh] shrink-0 flex-col items-center justify-center overflow-hidden bg-[#1C1412] px-6 pb-12 pt-10 text-center text-white sm:min-h-[40dvh] sm:px-10 lg:min-h-dvh lg:items-stretch lg:justify-between lg:px-12 lg:py-12 lg:text-left xl:px-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, #3F1F28 0%, #1C1412 46%, #0E2F2C 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-16 top-[-80px] h-[360px] w-[360px] rounded-full bg-[#9A4A5C]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-[-60px] h-[380px] w-[380px] rounded-full bg-[#1F6B64]/50 blur-3xl" />

      <motion.div
        custom={0.05}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative"
      >
        <div className="flex items-center justify-center gap-4 lg:justify-start">
          <span className="relative h-6 w-28 overflow-hidden sm:h-7 sm:w-32">
            <Image
              src="/logo/aerisbeaute/Aeris new logo-white-01.png"
              alt="Aeris Beaute"
              fill
              sizes="128px"
              className="object-cover object-left"
              priority
            />
          </span>
          <span className="h-5 w-px bg-white/25" />
          <span className="relative h-10 w-10 overflow-hidden sm:h-11 sm:w-11">
            <Image
              src="/logo/fti/FTI_Logogram_White.png"
              alt="From This Island"
              fill
              sizes="100px"
              className="object-contain"
              priority
            />
          </span>
        </div>
        <p className="mt-3 hidden text-xs font-medium uppercase tracking-[0.22em] text-white/60 lg:block">
          HR Recruitment
        </p>
      </motion.div>

      <motion.div
        custom={0.14}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative mt-8 max-w-lg lg:mt-0"
      >
        <p
          suppressHydrationWarning
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55"
        >
          {dayGreeting()}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-[1.15] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.1]">
          Your hiring{" "}
          <span className="text-[#C9DDD8]">workspace.</span>
        </h2>
        <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-white/70 sm:text-base lg:block">
          Pipeline, vacancies, and candidate emails for Aeris Beaute and From
          This Island — in one place.
        </p>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.32 } },
          }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:mt-8 lg:justify-start"
        >
          {HIGHLIGHTS.map((item) => (
            <motion.span
              key={item.label}
              title={item.label}
              variants={iconItem}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/90 lg:h-auto lg:w-auto lg:gap-1.5 lg:rounded-full lg:px-3 lg:py-1.5 lg:text-xs"
            >
              <item.icon className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              <span className="hidden lg:inline">{item.label}</span>
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.45, ease }}
        className="relative mt-10 hidden text-xs text-white/45 lg:mt-0 lg:block"
      >
        Aeris Beaute · From This Island
      </motion.p>
    </section>
  );
}
