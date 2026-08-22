"use client";

import { logoutAction, saveAppUserAction, type RoleState } from "@/app/actions/auth";
import { loadBrandProgress, type BrandProgress } from "@/lib/admin-stats";
import type { AppUser } from "@/lib/auth/app-users";
import { workspaceLabel } from "@/lib/auth/access";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { COMPANY_LIST, COMPANIES, themeStyle } from "@/lib/companies";
import type { CompanySlug } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyMark } from "./company-mark";
import { Select } from "./fields";
import { Field, fieldClass } from "./ui";

export function AdminHome({
  user,
  users,
}: {
  user: AuthUser;
  users: AppUser[];
}) {
  const [stats, setStats] = useState<Record<CompanySlug, BrandProgress> | null>(null);

  useEffect(() => {
    void Promise.all([
      loadBrandProgress("aeris-beaute"),
      loadBrandProgress("from-this-island"),
    ]).then(([aeris, fti]) => {
      setStats({ "aeris-beaute": aeris, "from-this-island": fti });
    });
  }, []);

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#F4EEE6] text-ink">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />

      <div className="relative flex min-h-full w-full min-w-0 flex-col px-4 py-5 sm:px-8 sm:py-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
              HR Recruitment · Admin
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:mt-3 sm:text-4xl lg:text-5xl">
              Progress across both brands.
            </h1>
          </div>
          <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {roleLabel(user.role)}
              </p>
            </div>
            <form action={logoutAction} className="sm:mt-3">
              <button type="submit" className="text-sm text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </motion.header>

        <div className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-2">
          {COMPANY_LIST.map((company, index) => {
            const progress = stats?.[company.slug];
            return (
              <motion.div
                key={company.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.08, duration: 0.45 }}
              >
                <Link
                  href={`/${company.slug}`}
                  style={themeStyle(company.theme)}
                  className="group block overflow-hidden rounded-[24px] border border-white/60 bg-paper-raised p-5 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] transition hover:-translate-y-1 sm:rounded-[28px] sm:p-7"
                >
                  <div
                    className="mb-6 h-px"
                    style={{ background: company.theme.accent }}
                  />
                  <div className="flex items-center gap-4">
                    <CompanyMark
                      slug={company.slug}
                      className={
                        company.slug === "aeris-beaute" ? "h-5 w-24" : "h-10 w-10"
                      }
                    />
                    <h2 className="min-w-0 font-display text-2xl sm:text-3xl">{company.name}</h2>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Candidates" value={progress?.candidates} />
                    <Stat label="Active" value={progress?.active} />
                    <Stat label="Open roles" value={progress?.openJobs} />
                    <Stat label="Hired / mo" value={progress?.hiredThisMonth} />
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                    Open workspace
                    <span className="transition group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <RoleSettings users={users} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-medium">{value ?? "—"}</p>
    </div>
  );
}

function RoleSettings({ users }: { users: AppUser[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<RoleState, FormData>(
    saveAppUserAction,
    null,
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [router, state?.success]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8 rounded-[24px] border border-white/60 bg-paper-raised p-5 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] sm:mt-10 sm:rounded-[28px] sm:p-6"
    >
      <h2 className="font-display text-2xl sm:text-3xl">User roles</h2>
      <p className="mt-1 text-sm text-muted">
        Only admin can open both brands. HR is locked to one workspace.
      </p>

      <div className="mt-5 space-y-3 md:hidden">
        {users.map((item) => (
          <div key={item.email} className="rounded-2xl border border-line px-4 py-3">
            <p className="font-medium">{item.name}</p>
            <p className="mt-0.5 break-all text-sm text-muted">{item.email}</p>
            <p className="mt-2 text-sm">
              {roleLabel(item.role)}
              <span className="text-muted"> · {workspaceLabel(item.company)}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Workspace</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.email} className="border-t border-line">
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-muted">{item.email}</td>
                <td className="py-3">{roleLabel(item.role)}</td>
                <td className="py-3 text-muted">{workspaceLabel(item.company)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={action} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            placeholder="name@aerisbeaute.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Name">
          <input name="name" required placeholder="Full name" className={fieldClass} />
        </Field>
        <Field label="Role">
          <Select
            name="role"
            defaultValue="hr"
            options={[
              { value: "hr", label: "HR" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </Field>
        <Field label="Workspace">
          <Select
            name="company"
            defaultValue="aeris-beaute"
            options={[
              { value: "aeris-beaute", label: COMPANIES["aeris-beaute"].name },
              { value: "from-this-island", label: COMPANIES["from-this-island"].name },
              { value: "both", label: "Both brands" },
            ]}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          {state?.error ? <p className="text-sm text-[#E24B4A]">{state.error}</p> : null}
          {state?.success ? <p className="text-sm text-accent">{state.success}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-3 rounded-full bg-[#1C1412] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save user role"}
          </button>
        </div>
      </form>
    </motion.section>
  );
}
