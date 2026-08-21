"use client";

import { loginAction, type LoginState } from "@/app/actions/auth";
import { Field, fieldClass } from "@/components/ui";
import { motion } from "framer-motion";
import { useActionState } from "react";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-[28px] border border-white/60 bg-paper-raised p-8 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)]"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
        HR Recruitment
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Use your Admin or HR account to open a brand dashboard.
      </p>

      <div className="mt-8 space-y-4">
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
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </motion.form>
  );
}
