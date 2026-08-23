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
  IconSettings,
  IconCalendar,
  IconTimeline,
} from "./icons";
import { logoutAction } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { AddCandidateModal, AddJobModal } from "./modals";

const NAV = [
  { href: "", label: "Overview", icon: IconGrid },
  { href: "/emails", label: "Emails", icon: IconMail },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

const TRACKER_LINKS = [
  { href: "/pipeline", label: "Pipeline", icon: IconKanban },
  { href: "/candidates", label: "Progress", icon: IconPeople },
  { href: "/calendar", label: "Calendar", icon: IconCalendar },
  { href: "/timeline", label: "Timeline", icon: IconTimeline },
  { href: "/jobs", label: "Vacancy", icon: IconBriefcase },
];

const REQUEST_LINKS = [
  { href: "/request/form", label: "Form", icon: IconClipboard },
  { href: "/request/responses", label: "Responses", icon: IconClipboard },
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
      <RecruitmentProvider slug={slug} userEmail={user.email}>
        <div className="flex h-full min-w-0">
          <Sidebar slug={slug} user={user} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Topbar user={user} />
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-8 lg:pb-4">
              <div className="no-native-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
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
        {NAV.filter((item) => item.href === "").map((item) => {
          const href = `/${slug}`;
          const active = pathname === href;
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
        <NavMenu
          slug={slug}
          pathname={pathname}
          label="Tracker"
          icon={IconKanban}
          links={TRACKER_LINKS}
          match={(path) =>
            TRACKER_LINKS.some((item) => path.startsWith(`/${slug}${item.href}`))
          }
        />
        {NAV.filter((item) => item.href !== "").map((item) => {
          const href = `/${slug}${item.href}`;
          const active = pathname.startsWith(href);
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
        <NavMenu
          slug={slug}
          pathname={pathname}
          label="Request"
          icon={IconClipboard}
          links={REQUEST_LINKS}
          match={(path) => path.includes("/request/")}
        />
      </nav>

      <div className="space-y-3 px-1">
        <div className="rounded-2xl border border-line px-3 py-3">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            {roleLabel(user.role)}
          </p>
        </div>
        {user.role === "admin" ? (
          <Link
            href={`/${other.slug}`}
            className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            <IconSwitch className="h-4 w-4" />
            Switch to {other.shortName}
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </form>
        {user.role === "admin" ? (
          <Link
            href="/"
            className="px-3 text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink"
          >
            Admin
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function NavMenu({
  slug,
  pathname,
  label,
  icon: Icon,
  links,
  match,
}: {
  slug: CompanySlug;
  pathname: string;
  label: string;
  icon: typeof IconKanban;
  links: { href: string; label: string }[];
  match: (pathname: string) => boolean;
}) {
  const active = match(pathname);
  const [open, setOpen] = useState(active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
          active
            ? "font-medium text-accent-deep hover:bg-paper"
            : "text-muted hover:bg-paper hover:text-ink"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        <IconChevronDown
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-1 ml-4 space-y-0.5 border-l border-line pl-3">
          {links.map((item) => {
            const href = `/${slug}${item.href}`;
            const current = pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`block rounded-xl px-3 py-2 text-sm transition ${
                  current
                    ? "bg-accent-soft font-medium text-accent-deep"
                    : "text-muted hover:bg-paper hover:text-ink"
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

function Topbar({ user }: { user: AuthUser }) {
  const { brand, slug } = useRecruitment();
  const pathname = usePathname();
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const other =
    slug === "aeris-beaute" ? COMPANIES["from-this-island"] : COMPANIES["aeris-beaute"];

  const title =
    pathname.includes("/request/form")
      ? "Request form"
      : pathname.includes("/request/responses")
        ? "Request responses"
        : (TRACKER_LINKS.find((item) => pathname.startsWith(`/${slug}${item.href}`))
            ?.label ??
          NAV.find((item) => {
            const href = `/${slug}${item.href}`;
            return item.href === ""
              ? pathname === `/${slug}`
              : pathname.startsWith(href);
          })?.label ??
          "Dashboard");

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted">
            {brand.name}
          </p>
          <h1 className="font-display text-xl leading-tight sm:text-2xl">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={`/${slug}/candidates`}
            className="inline-flex items-center justify-center rounded-full border border-line bg-paper-raised p-2 text-muted sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            aria-label="Search candidates"
          >
            <IconSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Search candidates</span>
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
            className="inline-flex items-center gap-2 rounded-full bg-accent p-2 text-sm font-medium text-white transition hover:bg-accent-hover sm:px-4 sm:py-2"
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Candidate</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-raised text-sm font-medium lg:hidden"
            aria-label="Account"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      {accountOpen ? (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setAccountOpen(false)}
        >
          <div
            className="absolute right-3 top-[4.25rem] w-[min(18rem,calc(100vw-1.5rem))] rounded-[20px] border border-line bg-paper-raised p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted">
              {roleLabel(user.role)}
            </p>
            {user.role === "admin" ? (
              <Link
                href={`/${other.slug}`}
                onClick={() => setAccountOpen(false)}
                className="mt-3 flex items-center gap-2 rounded-2xl px-2 py-2 text-sm text-muted hover:bg-paper hover:text-ink"
              >
                <IconSwitch className="h-4 w-4" />
                Switch to {other.shortName}
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-sm text-muted hover:bg-paper hover:text-ink"
              >
                <IconLogout className="h-4 w-4" />
                Sign out
              </button>
            </form>
            {user.role === "admin" ? (
              <Link
                href="/"
                onClick={() => setAccountOpen(false)}
                className="mt-1 block px-2 text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink"
              >
                Admin
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <MobileNav slug={slug} />

      <AddCandidateModal open={candidateOpen} onClose={() => setCandidateOpen(false)} />
      <AddJobModal open={jobOpen} onClose={() => setJobOpen(false)} />
    </>
  );
}

function MobileNav({ slug }: { slug: CompanySlug }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<"tracker" | "request" | null>(null);
  const [sheetPath, setSheetPath] = useState(pathname);
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    setSheet(null);
  }

  const trackerActive = TRACKER_LINKS.some((link) =>
    pathname.startsWith(`/${slug}${link.href}`),
  );
  const requestActive = pathname.includes("/request/");

  return (
    <>
      {sheet ? (
        <div
          className="fixed inset-0 z-30 bg-ink/20 lg:hidden"
          onClick={() => setSheet(null)}
        >
          <div
            className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] rounded-[22px] border border-line bg-paper-raised p-2 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(sheet === "tracker" ? TRACKER_LINKS : REQUEST_LINKS).map((item) => {
              const href = `/${slug}${item.href}`;
              const current = pathname.startsWith(href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${
                    current
                      ? "bg-accent-soft font-medium text-accent-deep"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 gap-1 border-t border-line bg-paper-raised/95 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <Link
          href={`/${slug}`}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
            pathname === `/${slug}` ? "text-accent" : "text-muted"
          }`}
        >
          <IconGrid className="h-4 w-4" />
          Overview
        </Link>
        <button
          type="button"
          onClick={() => setSheet((current) => (current === "tracker" ? null : "tracker"))}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
            trackerActive || sheet === "tracker" ? "text-accent" : "text-muted"
          }`}
        >
          <IconKanban className="h-4 w-4" />
          Tracker
        </button>
        <Link
          href={`/${slug}/emails`}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
            pathname.startsWith(`/${slug}/emails`) ? "text-accent" : "text-muted"
          }`}
        >
          <IconMail className="h-4 w-4" />
          Emails
        </Link>
        <Link
          href={`/${slug}/settings`}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
            pathname.startsWith(`/${slug}/settings`) ? "text-accent" : "text-muted"
          }`}
        >
          <IconSettings className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => setSheet((current) => (current === "request" ? null : "request"))}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
            requestActive || sheet === "request" ? "text-accent" : "text-muted"
          }`}
        >
          <IconClipboard className="h-4 w-4" />
          Request
        </button>
      </nav>
    </>
  );
}
