"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { COMPANIES, themeStyle } from "@/lib/companies";
import { RecruitmentProvider, useRecruitment } from "@/lib/recruitment-context";
import type { CompanySlug } from "@/lib/types";
import { CompanyMark } from "./company-mark";
import {
  IconBriefcase,
  IconGrid,
  IconKanban,
  IconPeople,
  IconPlus,
  IconSearch,
  IconSwitch,
  IconLogout,
  IconMail,
  IconClipboard,
  IconChevronDown,
} from "./icons";
import { logoutAction } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { AddCandidateModal, AddJobModal } from "./modals";

const NAV = [
  { href: "", label: "Overview", icon: IconGrid },
  { href: "/pipeline", label: "Pipeline", icon: IconKanban },
  { href: "/candidates", label: "Progress", icon: IconPeople },
  { href: "/jobs", label: "Vacancy", icon: IconBriefcase },
  { href: "/emails", label: "Emails", icon: IconMail },
];

const REQUEST_LINKS = [
  { href: "/request/form", label: "Form" },
  { href: "/request/responses", label: "Responses" },
];

export function DashboardShell({
  slug,
  user,
  children,
}: {
  slug: CompanySlug;
  user: AuthUser;
  children: ReactNode;
}) {
  const brand = COMPANIES[slug];

  return (
    <div style={themeStyle(brand.theme)} className="h-full bg-paper text-ink">
      <RecruitmentProvider slug={slug}>
        <div className="flex h-full">
          <Sidebar slug={slug} user={user} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-6 pb-24 sm:px-8 lg:pb-4">
              <div className="no-native-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </RecruitmentProvider>
    </div>
  );
}

function Sidebar({ slug, user }: { slug: CompanySlug; user: AuthUser }) {
  const pathname = usePathname();
  const brand = COMPANIES[slug];
  const other = slug === "aeris-beaute" ? COMPANIES["from-this-island"] : COMPANIES["aeris-beaute"];

  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-line bg-paper-raised/80 px-4 py-6 lg:flex">
      <Link
        href={`/${slug}`}
        className={
          slug === "aeris-beaute"
            ? "flex flex-col gap-3 px-2"
            : "flex items-center gap-3 px-2"
        }
      >
        <CompanyMark
          slug={slug}
          className={
            slug === "aeris-beaute" ? "h-5 w-24 self-start" : "h-11 w-11"
          }
        />
        <div>
          <p className="font-display text-lg leading-tight">{brand.name}</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Recruitment
          </p>
        </div>
      </Link>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const href = `/${slug}${item.href}`;
          const active =
            item.href === ""
              ? pathname === `/${slug}`
              : pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-accent-soft font-medium text-accent-deep"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <RequestMenu slug={slug} pathname={pathname} />
      </nav>

      <div className="space-y-3 px-1">
        <div className="rounded-2xl border border-line px-3 py-3">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            {roleLabel(user.role)}
          </p>
        </div>
        <Link
          href={`/${other.slug}`}
          className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-paper hover:text-ink"
        >
          <IconSwitch className="h-4 w-4" />
          Switch to {other.shortName}
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </form>
        <Link
          href="/"
          className="px-3 text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          All brands
        </Link>
      </div>
    </aside>
  );
}

function RequestMenu({ slug, pathname }: { slug: CompanySlug; pathname: string }) {
  const active = pathname.includes("/request/");
  const [open, setOpen] = useState(active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
          active
            ? "bg-accent-soft font-medium text-accent-deep"
            : "text-muted hover:bg-paper hover:text-ink"
        }`}
      >
        <IconClipboard className="h-4 w-4" />
        <span className="flex-1 text-left">Request</span>
        <IconChevronDown
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-1 ml-4 space-y-0.5 border-l border-line pl-3">
          {REQUEST_LINKS.map((item) => {
            const href = `/${slug}${item.href}`;
            const current = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`block rounded-xl px-3 py-2 text-sm ${
                  current
                    ? "font-medium text-accent-deep"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Topbar() {
  const { brand, slug } = useRecruitment();
  const pathname = usePathname();
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);

  const title =
    pathname.includes("/request/form")
      ? "Request form"
      : pathname.includes("/request/responses")
        ? "Request responses"
        : (NAV.find((item) => {
            const href = `/${slug}${item.href}`;
            return item.href === "" ? pathname === `/${slug}` : pathname.startsWith(href);
          })?.label ?? "Dashboard");

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-paper/85 px-5 py-4 backdrop-blur-md sm:px-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {brand.name}
          </p>
          <h1 className="font-display text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${slug}/candidates`}
            className="hidden items-center gap-2 rounded-full border border-line bg-paper-raised px-3 py-2 text-sm text-muted sm:flex"
          >
            <IconSearch className="h-4 w-4" />
            Search candidates
          </Link>
          <button
            type="button"
            onClick={() => setJobOpen(true)}
            className="hidden rounded-full border border-line px-3 py-2 text-sm text-ink sm:inline-flex"
          >
            Vacancy
          </button>
          <button
            type="button"
            onClick={() => setCandidateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            <IconPlus className="h-4 w-4" />
            Candidate
          </button>
        </div>
      </header>

      <MobileNav slug={slug} />

      <AddCandidateModal open={candidateOpen} onClose={() => setCandidateOpen(false)} />
      <AddJobModal open={jobOpen} onClose={() => setJobOpen(false)} />
    </>
  );
}

function MobileNav({ slug }: { slug: CompanySlug }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 gap-1 border-t border-line bg-paper-raised/95 px-2 py-2 backdrop-blur lg:hidden">
      {[
        ...NAV,
        { href: "/request/responses", label: "Request", icon: IconClipboard },
      ].map((item) => {
        const href = `/${slug}${item.href}`;
        const active =
          item.href === ""
            ? pathname === `/${slug}`
            : pathname.startsWith(`/${slug}${item.href.split("/").slice(0, 2).join("/")}`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
