import { canAccessCompany } from "@/lib/auth/access";
import { loadAppUser } from "@/lib/auth/app-users";
import { getSession } from "@/lib/auth/session";
import {
  removeRecruitmentApproval,
  syncStoredRecruitmentApproval,
} from "@/lib/lark/approval";
import { isLarkConfigured } from "@/lib/lark/client";
import {
  isRequestCompany,
  slugFromRequestCompany,
} from "@/lib/recruitment-request";
import {
  deleteRecruitmentRequest,
  loadRecruitmentRequest,
  updateRecruitmentRequest,
} from "@/lib/request-approval";
import type { Session } from "@/lib/auth/session";
import { NextResponse } from "next/server";

async function requireEditor(): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (session.role === "it") {
    return { error: NextResponse.json({ error: "IT cannot edit request responses." }, { status: 403 }) };
  }
  return { session };
}

async function forbiddenCompany(session: Session, company: string) {
  if (!isRequestCompany(company)) return null;
  const profile = await loadAppUser(session.email);
  if (canAccessCompany(session, slugFromRequestCompany(company), profile?.company)) {
    return null;
  }
  return NextResponse.json({ error: "You cannot edit this company’s requests." }, { status: 403 });
}

function larkWarning(cause: unknown, saved = true) {
  const raw = cause instanceof Error ? cause.message : "Lark Approval was not updated.";
  const prefix = saved
    ? "Saved in the dashboard"
    : "Removed from the dashboard";
  if (/approval:approval|approval:external_approval|approval:external_instance|Access denied/i.test(raw)) {
    return `${prefix}, but Lark Approval permission is missing.`;
  }
  return `${prefix}, but Lark Approval was not updated. ${raw}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEditor();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = (await request.json()) as { payload?: Record<string, string> };
  const answers = body.payload;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Updated fields are required." }, { status: 400 });
  }

  const current = await loadRecruitmentRequest(id);
  if (!current) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const denied = await forbiddenCompany(auth.session, current.company || current.payload.company);
  if (denied) return denied;

  let saved;
  try {
    saved = await updateRecruitmentRequest(id, answers);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Could not update the request." },
      { status: 500 },
    );
  }

  let warning = "";
  if (isLarkConfigured()) {
    try {
      await syncStoredRecruitmentApproval(saved, [
        auth.session.email,
        process.env.LARK_INITIATOR_OPEN_ID ?? "",
      ]);
    } catch (cause) {
      warning = larkWarning(cause);
    }
  }

  return NextResponse.json({
    ok: true,
    warning: warning || undefined,
    row: {
      id: saved.id,
      created_at: saved.created_at,
      payload: saved.payload,
      approval_status: saved.approval_status,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEditor();
  if (auth.error) return auth.error;
  const { id } = await params;

  const current = await loadRecruitmentRequest(id);
  if (!current) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const denied = await forbiddenCompany(auth.session, current.company || current.payload.company);
  if (denied) return denied;

  let warning = "";
  if (isLarkConfigured()) {
    try {
      await removeRecruitmentApproval(current, [
        auth.session.email,
        process.env.LARK_INITIATOR_OPEN_ID ?? "",
      ]);
    } catch (cause) {
      warning = larkWarning(cause, false);
    }
  }

  try {
    await deleteRecruitmentRequest(id);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Could not delete the request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, warning: warning || undefined });
}
