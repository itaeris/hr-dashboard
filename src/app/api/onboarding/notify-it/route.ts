import { canAccessCompany } from "@/lib/auth/access";
import { listAppUsers, loadAppUser } from "@/lib/auth/app-users";
import { PRODUCTION_ORIGIN } from "@/lib/auth/google";
import { getSession } from "@/lib/auth/session";
import { COMPANIES, isCompanySlug } from "@/lib/companies";
import { isSmtpConfigured, sendSmtpMail } from "@/lib/email/smtp";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dashboardOrigin(request: Request) {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

async function itDeskEmail(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return "";
  const { data } = await supabase
    .from("onboarding_settings")
    .select("it_email")
    .eq("company_slug", slug)
    .maybeSingle();
  const value = typeof data?.it_email === "string" ? data.it_email.trim().toLowerCase() : "";
  return EMAIL.test(value) ? value : "";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (session.role === "it") {
    return NextResponse.json({ error: "HR sends this notification." }, { status: 403 });
  }

  const payload = (await request.json()) as {
    company?: string;
    name?: string;
    role?: string;
    workEmail?: string;
    requestKind?: string;
    laptopNeeded?: boolean;
    apps?: string[];
    notes?: string;
    joinDate?: string | null;
  };

  const company = payload.company;
  if (!company || !isCompanySlug(company)) {
    return NextResponse.json({ error: "Choose a workspace." }, { status: 400 });
  }

  const profile = await loadAppUser(session.email);
  if (!canAccessCompany(session, company, profile?.company)) {
    return NextResponse.json({ error: "You cannot send from this workspace." }, { status: 403 });
  }

  const name = String(payload.name ?? "").trim();
  const role = String(payload.role ?? "").trim();
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Hire name is required." }, { status: 400 });
  }

  const users = await listAppUsers();
  const itUsers = users.filter(
    (user) =>
      user.role === "it" &&
      canAccessCompany(
        { id: user.email, email: user.email, name: user.name, role: user.role },
        company,
        user.company,
      ),
  );
  const recipients = [
    ...new Set(
      [await itDeskEmail(company), ...itUsers.map((user) => user.email)].filter(
        (email) => EMAIL.test(email),
      ),
    ),
  ];

  if (recipients.length === 0) {
    return NextResponse.json({ notified: false, reason: "no-recipients" });
  }
  if (!isSmtpConfigured()) {
    return NextResponse.json({ notified: false, reason: "smtp" });
  }

  const brand = COMPANIES[company].name;
  const kind = payload.requestKind === "replacement" ? "Replacement" : "New";
  const laptop = payload.laptopNeeded === false ? "Not required" : "Required";
  const apps = Array.isArray(payload.apps)
    ? payload.apps.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
    : [];
  const notes = String(payload.notes ?? "").trim().slice(0, 2000);
  const workEmail = String(payload.workEmail ?? "").trim().slice(0, 254);
  const joinDate = String(payload.joinDate ?? "").trim().slice(0, 40) || "TBC";
  const deskUrl = `${dashboardOrigin(request)}/${company}/onboarding`;

  const text = `Hi IT team,

HR sent an IT request for ${name} (${role || "role TBC"}) at ${brand}.

Type: ${kind}
Work email: ${workEmail || "TBC"}
Laptop: ${laptop}${apps.length ? `\nApps to install: ${apps.join(", ")}` : ""}
Join date: ${joinDate}
Requested by: ${session.email}
${notes ? `\nNotes from HR:\n${notes}\n` : ""}
Open the IT desk to process this request:
${deskUrl}

Sign in with your IT account. The hire will be waiting under Requests.`;

  try {
    const [to, ...cc] = recipients;
    await sendSmtpMail({
      to,
      cc,
      subject: `IT request — ${name} (${kind}, ${brand})`,
      text,
      company,
      replyTo: session.email,
    });
    return NextResponse.json({ notified: true });
  } catch {
    return NextResponse.json({ notified: false, reason: "send-failed" });
  }
}
