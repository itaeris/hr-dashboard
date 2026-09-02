import { getSession } from "@/lib/auth/session";
import {
  resolveLarkOpenId,
  syncRecruitmentApproval,
} from "@/lib/lark/approval";
import { isLarkConfigured } from "@/lib/lark/client";
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
      approval_comment: row.approval_comment,
    });
  }

  const session = await getSession();
  const decidedBy = session?.email || session?.name || "Lark approver";
  const saved = await saveRecruitmentApproval(id, {
    approval_status: action,
    approval_comment: payload.comment?.trim() ?? "",
    approval_decided_by: decidedBy,
  });

  if (isLarkConfigured()) {
    try {
      const supervisorOpenId = await resolveLarkOpenId(
        saved.payload.direct_supervisor_id ?? "",
        saved.payload.direct_supervisor ?? "",
      );
      await syncRecruitmentApproval({
        id: saved.id,
        status: saved.approval_status,
        jobPosition: saved.payload.job_position ?? "",
        company: saved.company || saved.payload.company || "",
        department: saved.payload.department ?? "",
        supervisorName: saved.payload.direct_supervisor ?? "",
        supervisorOpenId,
        initiatorOpenId: await resolveLarkOpenId(session?.email ?? "", supervisorOpenId),
        comment: saved.approval_comment,
      });
    } catch (cause) {
      return NextResponse.json({
        approval_status: saved.approval_status,
        approval_comment: saved.approval_comment,
        warning: cause instanceof Error ? cause.message : "Saved, but Lark Approval was not updated.",
      });
    }
  }

  return NextResponse.json({
    approval_status: saved.approval_status,
    approval_comment: saved.approval_comment,
  });
}
