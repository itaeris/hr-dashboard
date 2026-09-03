"use client";

import { changePasswordAction, type PasswordState } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { useActionState } from "react";
import { GoogleCalendarSync } from "./google-calendar-sync";
import { PageFade, Field, PasswordInput } from "./ui";
import { ApprovalProcessSettings } from "./approval-process-settings";
import { VacancyLevelsSettings } from "./vacancy-levels-settings";
import { LaptopAppsSettings } from "./laptop-apps-settings";
import { ScheduleAlertSettings } from "./schedule-alert-settings";

export function SettingsPage({
  user,
  hasPassword,
}: {
  user: AuthUser;
  hasPassword: boolean;
}) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <PageFade className="w-full max-w-none space-y-5">
      <p className="text-sm text-muted">
        Update the password for email sign-in. Google sign-in is unchanged.
      </p>

      {user.role === "it" ? null : (
        <>
          <GoogleCalendarSync surface="settings" />
          <ApprovalProcessSettings />
          <ScheduleAlertSettings />
          <VacancyLevelsSettings />
          <LaptopAppsSettings />
        </>
      )}

      <div className="rounded-[24px] border border-line bg-paper-raised p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Account</p>
        <p className="mt-2 text-sm font-medium">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
          {roleLabel(user.role)}
        </p>
      </div>

      <form action={action} className="space-y-4 rounded-[24px] border border-line bg-paper-raised p-5">
        <h2 className="text-lg font-medium">Change password</h2>
        {hasPassword ? (
          <Field label="Current password">
            <PasswordInput
              name="current_password"
              autoComplete="current-password"
              required
            />
          </Field>
        ) : (
          <p className="text-sm text-muted">
            This account was created with Google. Set a password to also sign in
            with email.
          </p>
        )}
        <Field label="New password">
          <PasswordInput
            name="new_password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput
            name="confirm_password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>

        {state?.error ? (
          <p className="text-sm text-[#E24B4A]">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-accent">{state.success}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : hasPassword ? "Update password" : "Set password"}
        </button>
      </form>
    </PageFade>
  );
}
