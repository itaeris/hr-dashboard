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
    <div className="relative min-h-full overflow-x-clip bg-[#F4EEE6] text-ink">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 py-6 sm:px-10 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
              HR Recruitment
            </p>
            <h1 className="mt-2 max-w-xl font-display text-3xl leading-tight text-ink sm:mt-3 sm:text-4xl lg:text-5xl">
              Select a company to manage recruitment.
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

        <div className="mt-8 grid flex-1 gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-2">
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
                className="group relative flex h-full min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-white/60 bg-paper-raised p-6 text-center shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] transition duration-300 hover:-translate-y-1 sm:min-h-[260px] sm:rounded-[28px] sm:p-8"
              >
                <div
                  className="absolute inset-x-8 top-0 h-px"
                  style={{ background: company.theme.accent }}
                />
                <CompanyMark
                  slug={company.slug}
                  className={
                    company.slug === "aeris-beaute" ? "h-6 w-28" : "h-14 w-14"
                  }
                />
                <h2 className="mt-6 font-display text-2xl text-ink sm:mt-8 sm:text-4xl">
                  {company.name}
                </h2>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                  Open
                  <span className="transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
