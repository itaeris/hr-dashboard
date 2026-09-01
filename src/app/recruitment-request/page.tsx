import { RequestFormPage } from "@/components/request-form";
import { isRequestCompany } from "@/lib/recruitment-request";
import type { Metadata } from "next";

const description =
  "Request a new or replacement hire for Aeris Beaute, KIN, or From This Island.";

export const metadata: Metadata = {
  title: "Recruitment Request Form",
  description,
  alternates: {
    canonical: "/recruitment-request",
  },
  openGraph: {
    url: "/recruitment-request",
    title: "Recruitment Request Form",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Recruitment Request Form",
    description,
  },
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
