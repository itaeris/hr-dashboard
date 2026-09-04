import { insertRecruitmentRequest } from "@/lib/request-approval";
import { isRequestCompany } from "@/lib/recruitment-request";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { clientIpFrom } from "@/lib/auth/rate-limit";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    payload?: Record<string, string>;
    turnstileToken?: string;
  };
  const id = body.id?.trim() ?? "";
  const payload = body.payload;
  const company = payload?.company?.trim() ?? "";
  if (!id || !payload || !isRequestCompany(company)) {
    return NextResponse.json({ error: "A valid request is required." }, { status: 400 });
  }

  const ip = clientIpFrom(await headers());
  const human = await verifyTurnstileToken(body.turnstileToken ?? "", ip);
  if (!human) {
    return NextResponse.json(
      { error: "Could not verify you are human. Refresh and try again." },
      { status: 400 },
    );
  }

  try {
    await insertRecruitmentRequest({ id, company, payload });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Could not save the request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
