import { RequestApprovalPage } from "@/components/request-approval-page";
import { getSession } from "@/lib/auth/session";
import { loadRecruitmentRequest } from "@/lib/request-approval";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Recruitment request approval",
  robots: { index: false, follow: false },
};

export default async function RecruitmentRequestApprovalRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, session] = await Promise.all([loadRecruitmentRequest(id), getSession()]);
  if (!request) notFound();
  return (
    <RequestApprovalPage
      request={request}
      viewer={session ? { name: session.name, email: session.email } : null}
    />
  );
}
