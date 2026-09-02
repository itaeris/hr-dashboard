import { getSession } from "@/lib/auth/session";
import {
  resolveLarkOpenId,
  syncRecruitmentApproval,
} from "@/lib/lark/approval";
import { isLarkConfigured } from "@/lib/lark/client";
import { loadRecruitmentRequest } from "@/lib/request-approval";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json()) as { id?: string };
  const id = payload.id?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Request id is required." }, { status: 400 });

  const row = await loadRecruitmentRequest(id);
  if (!row) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (!isLarkConfigured()) {
    return NextResponse.json(
      { error: "Lark is not configured.", url: `/recruitment-request/approval/${id}` },
      { status: 503 },
    );
  }

  const session = await getSession();
  const supervisorOpenId = await resolveLarkOpenId(
    row.payload.direct_supervisor_id ?? "",
    row.payload.direct_supervisor ?? "",
  );
  const initiatorOpenId = await resolveLarkOpenId(
    session?.email ?? "",
    process.env.LARK_INITIATOR_OPEN_ID ?? "",
    supervisorOpenId,
  );

  try {
    await syncRecruitmentApproval({
      id: row.id,
      status: row.approval_status,
      jobPosition: row.payload.job_position ?? "",
      company: row.company || row.payload.company || "",
      department: row.payload.department ?? "",
      supervisorName: row.payload.direct_supervisor ?? "",
      supervisorOpenId,
      initiatorOpenId,
    });
    return NextResponse.json({ ok: true, url: `/recruitment-request/approval/${id}` });
  } catch (cause) {
    return NextResponse.json(
      {
        error: cause instanceof Error ? cause.message : "Could not notify Lark Approval.",
        url: `/recruitment-request/approval/${id}`,
      },
      { status: 502 },
    );
  }
}
