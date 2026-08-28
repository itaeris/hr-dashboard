import { DashboardShell } from "@/components/dashboard-shell";
import { requireCompanyAccess } from "@/app/actions/auth";
import { loadAppUser } from "@/lib/auth/app-users";
import { COMPANIES, isCompanySlug } from "@/lib/companies";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ company: "aeris-beaute" }, { company: "from-this-island" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ company: string }>;
}): Promise<Metadata> {
  const { company } = await params;
  if (!isCompanySlug(company)) return { title: "HR Recruitment" };
  return { title: `${COMPANIES[company].name} · Recruitment` };
}

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  if (!isCompanySlug(company)) notFound();
  const user = await requireCompanyAccess(company);
  const profile = await loadAppUser(user.email);
  return (
    <DashboardShell slug={company} user={user} workspace={profile?.company}>
      {children}
    </DashboardShell>
  );
}
