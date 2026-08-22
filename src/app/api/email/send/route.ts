import { getSession } from "@/lib/auth/session";
import { isSmtpConfigured, sendSmtpMail } from "@/lib/email/smtp";
import type { EmailAttachment } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "SMTP is not configured. Add MAIL_* keys to .env.local." },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as {
    to?: string;
    subject?: string;
    body?: string;
    attachments?: EmailAttachment[];
  };

  const to = payload.to?.trim() ?? "";
  const subject = payload.subject?.trim() ?? "";
  const text = payload.body?.trim() ?? "";

  if (!to || !subject || !text) {
    return NextResponse.json(
      { error: "To, subject, and body are required." },
      { status: 400 },
    );
  }

  try {
    await sendSmtpMail({
      to,
      subject,
      text,
      attachments: payload.attachments ?? [],
      replyTo: session.email,
    });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not send email.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
