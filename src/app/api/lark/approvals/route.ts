import { getSession } from "@/lib/auth/session";
import { syncStoredRecruitmentApproval } from "@/lib/lark/approval";
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

  try {
    await syncStoredRecruitmentApproval(row, [
      session?.email ?? "",
      process.env.LARK_INITIATOR_OPEN_ID ?? "",
    ]);
    return NextResponse.json({ ok: true, url: `/recruitment-request/approval/${id}` });
  } catch (cause) {
    const raw = cause instanceof Error ? cause.message : "Could not notify Lark Approval.";
    const error = /approval:approval|approval:external_approval|approval:external_instance|Access denied/i.test(
      raw,
    )
      ? "Lark Approval permission is missing. Add approval:approval and approval:external_instance (or approval:external_approval) in the Lark Developer Console, publish the app, then submit again."
      : raw;
    return NextResponse.json(
      { error, url: `/recruitment-request/approval/${id}` },
      { status: 502 },
    );
  }
}
