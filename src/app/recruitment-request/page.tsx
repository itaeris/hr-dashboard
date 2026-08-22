import { RequestFormPage } from "@/components/request-form";
import { isRequestCompany } from "@/lib/recruitment-request";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruitment Request Form",
  description:
    "Request a new or replacement hire for Aeris Beaute, KIN, or From This Island.",
};

export default async function RecruitmentRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company } = await searchParams;
  return (
    <RequestFormPage
      initialCompany={company && isRequestCompany(company) ? company : undefined}
    />
  );
}
