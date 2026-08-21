"use client";

import { logoutAction } from "@/app/actions/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { COMPANY_LIST, themeStyle } from "@/lib/companies";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { CompanyMark } from "./company-mark";

export function CompanyPicker({ user }: { user: AuthUser }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#F4EEE6] text-ink">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-10 sm:px-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-6"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
              HR Recruitment
            </p>
            <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-ink sm:text-5xl">
              Choose the brand house you want to manage today.
            </h1>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {roleLabel(user.role)}
            </p>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="text-sm text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </motion.header>

        <div className="mt-12 grid flex-1 gap-6 lg:grid-cols-2">
          {COMPANY_LIST.map((company, index) => (
            <motion.div
              key={company.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}
            >
              <Link
                href={`/${company.slug}`}
                style={themeStyle(company.theme)}
                className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-paper-raised p-8 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] transition duration-300 hover:-translate-y-1"
              >
                <div
                  className="absolute inset-x-8 top-0 h-px"
                  style={{ background: company.theme.accent }}
                />
                <div className="flex items-start justify-between gap-4">
                  <CompanyMark
                    slug={company.slug}
                    className={
                      company.slug === "aeris-beaute"
                        ? "h-6 w-28"
                        : "h-14 w-14"
                    }
                  />
                  <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                    {company.industry}
                  </span>
                </div>

                <div className="mt-auto pt-16">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    Est. {company.founded} · {company.city}
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-ink">
                    {company.name}
                  </h2>
                  <p className="mt-2 text-base text-muted">{company.tagline}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent">
                    Open dashboard
                    <span className="transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
