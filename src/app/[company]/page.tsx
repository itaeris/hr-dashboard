import { OverviewPage } from "@/components/overview";
import { requireCompanyAccess } from "@/app/actions/auth";
import { isCompanySlug } from "@/lib/companies";
import { notFound, redirect } from "next/navigation";

export default async function CompanyHome({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  if (!isCompanySlug(company)) notFound();
  const user = await requireCompanyAccess(company);
  if (user.role === "it") redirect(`/${company}/onboarding`);
  return <OverviewPage />;
}
