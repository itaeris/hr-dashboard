import { canAccessCompany } from "@/lib/auth/access";
import { loadAppUser } from "@/lib/auth/app-users";
import { getSession } from "@/lib/auth/session";
import { isCompanySlug } from "@/lib/companies";
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
    company?: string;
    attachments?: EmailAttachment[];
  };

  const to = payload.to?.trim() ?? "";
  const subject = payload.subject?.trim() ?? "";
  const text = payload.body?.trim() ?? "";
  const company = payload.company;
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.slice(0, 5)
    : [];

  if (!company || !isCompanySlug(company)) {
    return NextResponse.json({ error: "Choose a workspace." }, { status: 400 });
  }

  const profile = await loadAppUser(session.email);
  if (!canAccessCompany(session, company, profile?.company)) {
    return NextResponse.json({ error: "You cannot send from this workspace." }, { status: 403 });
  }

  if (!to || !subject || !text) {
    return NextResponse.json(
      { error: "To, subject, and body are required." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || to.length > 254) {
    return NextResponse.json({ error: "Enter a valid recipient email." }, { status: 400 });
  }
  if (subject.length > 200 || text.length > 20_000) {
    return NextResponse.json({ error: "Subject or body is too long." }, { status: 400 });
  }

  try {
    await sendSmtpMail({
      to,
      subject,
      text,
      company,
      attachments,
      replyTo: session.email,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send email." }, { status: 502 });
  }
}
