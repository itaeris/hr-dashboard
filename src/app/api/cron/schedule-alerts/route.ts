import { sendScheduleAlertDigests } from "@/lib/schedule-alert-mail";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (secret) return header === `Bearer ${secret}`;
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await sendScheduleAlertDigests();
  return NextResponse.json({ ok: true, ...result });
}
