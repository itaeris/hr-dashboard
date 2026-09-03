import { getSession } from "@/lib/auth/session";
import { syncStoredRecruitmentApproval } from "@/lib/lark/approval";
import { isLarkConfigured } from "@/lib/lark/client";
import {
  APPROVAL_STEP_LABELS,
  canDecideCurrentStep,
  nextApprovalStep,
} from "@/lib/recruitment-approval-flow";
import { loadApprovalFlowServer } from "@/lib/recruitment-approval-settings-server";
import {
  isRequestCompany,
  slugFromRequestCompany,
} from "@/lib/recruitment-request";
import {
  loadRecruitmentRequest,
  saveRecruitmentApproval,
} from "@/lib/request-approval";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await request.json()) as { action?: string; comment?: string };
  const action = payload.action === "rejected" ? "rejected" : payload.action === "approved" ? "approved" : "";
  if (!action) {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  if (action === "rejected" && !payload.comment?.trim()) {
    return NextResponse.json({ error: "Add a short reason to reject." }, { status: 400 });
  }

  const row = await loadRecruitmentRequest(id);
  if (!row) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (row.approval_status !== "pending") {
    return NextResponse.json({
      approval_status: row.approval_status,
      approval_step: row.approval_step,
      approval_comment: row.approval_comment,
    });
  }

  const company = row.company || row.payload.company || "";
  const slug = isRequestCompany(company)
    ? slugFromRequestCompany(company)
    : "aeris-beaute";
  const fallbackFlow = await loadApprovalFlowServer(slug);

  const nextStep = action === "rejected" ? row.approval_step : nextApprovalStep(row.approval_step);
  const nextStatus =
    action === "rejected" ? "rejected" : nextStep === "done" ? "approved" : "pending";

  const session = await getSession();
  if (
    session &&
    !canDecideCurrentStep(
      { name: session.name, email: session.email },
      row.approval_step,
      row.payload,
      fallbackFlow,
    )
  ) {
    return NextResponse.json(
      {
        error: `Waiting for ${APPROVAL_STEP_LABELS[row.approval_step]}. You cannot act on this step yet.`,
      },
      { status: 403 },
    );
  }

  const decidedBy = session?.email || session?.name || "Lark approver";
  const saved = await saveRecruitmentApproval(id, {
    approval_status: nextStatus,
    approval_step: nextStep,
    approval_comment: payload.comment?.trim() ?? "",
    approval_decided_by: decidedBy,
  });

  if (isLarkConfigured()) {
    try {
      await syncStoredRecruitmentApproval(saved, [
        session?.email ?? "",
        process.env.LARK_INITIATOR_OPEN_ID ?? "",
      ]);
    } catch (cause) {
      return NextResponse.json({
        approval_status: saved.approval_status,
        approval_step: saved.approval_step,
        approval_comment: saved.approval_comment,
        warning: cause instanceof Error ? cause.message : "Saved, but Lark Approval was not updated.",
      });
    }
  }

  return NextResponse.json({
    approval_status: saved.approval_status,
    approval_step: saved.approval_step,
    approval_comment: saved.approval_comment,
  });
}
