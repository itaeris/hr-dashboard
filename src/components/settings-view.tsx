"use client";

import { changePasswordAction, type PasswordState } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth/users";
import { canUseHrMenu, roleLabel } from "@/lib/auth/users";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, type ComponentType } from "react";
import { ApprovalProcessSettings } from "./approval-process-settings";
import { GoogleCalendarSync } from "./google-calendar-sync";
import {
  IconBriefcase,
  IconCalendar,
  IconClipboard,
  IconLaptop,
  IconLock,
  IconMail,
} from "./icons";
import { LaptopAppsSettings } from "./laptop-apps-settings";
import { ScheduleAlertSettings } from "./schedule-alert-settings";
import { PageFade, Field, PasswordInput } from "./ui";
import { VacancyLevelsSettings } from "./vacancy-levels-settings";

type SettingsMenu =
  | "request"
  | "vacancy"
  | "calendar"
  | "emails"
  | "onboarding"
  | "account";

type MenuItem = {
  id: SettingsMenu;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const HR_MENUS: MenuItem[] = [
  {
    id: "request",
    label: "Request",
    description: "Approval process for hire requests",
    icon: IconClipboard,
  },
  {
    id: "vacancy",
    label: "Vacancy",
    description: "Level options on Vacancy Tracker",
    icon: IconBriefcase,
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Google Calendar connection",
    icon: IconCalendar,
  },
  {
    id: "emails",
    label: "Emails",
    description: "Scheduled reminder emails",
    icon: IconMail,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "IT laptop apps and notify email",
    icon: IconLaptop,
  },
  {
    id: "account",
    label: "Account",
    description: "Profile and password",
    icon: IconLock,
  },
];

const IT_MENUS: MenuItem[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile and password",
    icon: IconLock,
  },
];

function parseMenu(value: string | null, allowed: SettingsMenu[], fallback: SettingsMenu) {
  if (value && allowed.includes(value as SettingsMenu)) return value as SettingsMenu;
  return fallback;
}

export function SettingsPage({
  user,
  hasPassword,
}: {
  user: AuthUser;
  hasPassword: boolean;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading settings…</p>}>
      <SettingsPageInner user={user} hasPassword={hasPassword} />
    </Suspense>
  );
}

function SettingsPageInner({
  user,
  hasPassword,
}: {
  user: AuthUser;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hrMenu = canUseHrMenu(user.role);
  const menus = hrMenu ? HR_MENUS : IT_MENUS;
  const allowed = menus.map((item) => item.id);
  const fallback = allowed[0] ?? "account";
  const menu = searchParams.get("google")
    ? parseMenu("calendar", allowed, fallback)
    : parseMenu(searchParams.get("menu"), allowed, fallback);
  const active = menus.find((item) => item.id === menu) ?? menus[0];

  function openMenu(id: SettingsMenu) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("menu", id);
    if (id !== "calendar") params.delete("google");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <PageFade className="w-full max-w-none">
      <p className="text-sm text-muted">
        Settings are grouped by the same menus as the sidebar. Open a menu to
        change only that area.
      </p>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        <nav
          aria-label="Settings menus"
          className="flex gap-1 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {menus.map((item) => {
            const Icon = item.icon;
            const current = item.id === menu;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openMenu(item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                  current
                    ? "bg-accent-soft font-medium text-accent-deep"
                    : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block">{item.label}</span>
                  <span className="hidden text-xs font-normal text-muted lg:block">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-5">
          {active ? (
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {active.label}
            </p>
          ) : null}
          {menu === "request" ? <ApprovalProcessSettings /> : null}
          {menu === "vacancy" ? <VacancyLevelsSettings /> : null}
          {menu === "calendar" ? <GoogleCalendarSync surface="settings" /> : null}
          {menu === "emails" ? <ScheduleAlertSettings /> : null}
          {menu === "onboarding" ? <LaptopAppsSettings /> : null}
          {menu === "account" ? (
            <AccountSettings user={user} hasPassword={hasPassword} />
          ) : null}
        </div>
      </div>
    </PageFade>
  );
}

function AccountSettings({
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
    <>
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
    </>
  );
}
