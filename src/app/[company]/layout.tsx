import { DashboardShell } from "@/components/dashboard-shell";
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
  return <DashboardShell slug={company}>{children}</DashboardShell>;
}
