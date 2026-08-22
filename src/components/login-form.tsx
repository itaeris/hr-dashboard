"use client";

import { loginAction, type LoginState } from "@/app/actions/auth";
import { IconGoogle } from "@/components/icons";
import { Field, fieldClass } from "@/components/ui";
import { motion } from "framer-motion";
import { useActionState } from "react";

const OAUTH_ERRORS: Record<string, string> = {
  domain: "Use a Google account from @aerisbeaute.com or @fromthisisland.com.",
  oauth: "Google sign-in failed. Try again.",
  config: "Google sign-in is not configured yet.",
  denied: "Google sign-in was cancelled.",
};

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const error = state?.error ?? (oauthError ? OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.oauth : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-[28px] border border-white/60 bg-paper-raised p-5 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] sm:p-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
        HR Recruitment
      </p>
      <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">Sign in</h1>
      {/* <p className="mt-2 text-sm text-muted">
        Company Google accounts only: @aerisbeaute.com and @fromthisisland.com.
      </p> */}

      <form action={action} className="mt-8 space-y-4">
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@aerisbeaute.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={fieldClass}
          />
        </Field>

        {error ? (
          <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
        <span className="h-px flex-1 bg-line" />
        or google
        <span className="h-px flex-1 bg-line" />
      </div>

      <a
        href="/api/auth/google"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-3 text-sm font-medium text-ink transition hover:border-accent"
      >
        <IconGoogle className="h-4 w-4" />
        Continue with Google
      </a>
    </motion.div>
  );
}
