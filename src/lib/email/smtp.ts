import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmailAttachment } from "@/lib/email-templates";
import {
  COMPANY_EMAIL_LOGOS,
  EMAIL_LOGO_CID,
  emailBodyHtml,
} from "@/lib/email/signature";
import type { CompanySlug } from "@/lib/types";

const LOGO_DISK_PATH: Record<CompanySlug, string> = {
  "aeris-beaute": join(process.cwd(), "public/logo/aerisbeaute/Aeris new logo-01.png"),
  "from-this-island": join(process.cwd(), "public/logo/fti/FA_FromThisIsland_Charcoal.png"),
};

export function isSmtpConfigured() {
  return Boolean(
    process.env.MAIL_HOST &&
      process.env.MAIL_USERNAME &&
      process.env.MAIL_PASSWORD,
  );
}

function toNodemailerAttachment(file: EmailAttachment) {
  if (file.url.startsWith("data:")) {
    const comma = file.url.indexOf(",");
    const header = comma === -1 ? file.url : file.url.slice(0, comma);
    const content = comma === -1 ? "" : file.url.slice(comma + 1);
    const mime = header.slice(5).split(";")[0] || file.type || "application/octet-stream";
    return {
      filename: file.name,
      content,
      encoding: header.includes("base64") ? ("base64" as const) : undefined,
      contentType: mime,
    };
  }

  return {
    filename: file.name,
    path: file.url,
    contentType: file.type || "application/octet-stream",
  };
}

async function readEmailLogo(slug: CompanySlug) {
  try {
    return await readFile(LOGO_DISK_PATH[slug]);
  } catch {
    const origin =
      process.env.AUTH_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    if (!origin) {
      throw new Error("Company logo is missing.");
    }
    const response = await fetch(`${origin}${COMPANY_EMAIL_LOGOS[slug].publicPath}`);
    if (!response.ok) {
      throw new Error("Company logo is missing.");
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function sendSmtpMail(input: {
  to: string;
  subject: string;
  text: string;
  company: CompanySlug;
  attachments?: EmailAttachment[];
  replyTo?: string;
}) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const port = Number(process.env.MAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const fromName = process.env.MAIL_FROM_NAME || "HR Recruitment";
  const fromAddress =
    process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || "";
  const logo = COMPANY_EMAIL_LOGOS[input.company];
  const content = await readEmailLogo(input.company);

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: emailBodyHtml(input.text, input.company),
    replyTo: input.replyTo,
    attachments: [
      {
        filename: logo.fileName,
        content,
        cid: EMAIL_LOGO_CID,
        contentType: "image/png",
        contentDisposition: "inline",
      },
      ...(input.attachments ?? []).map(toNodemailerAttachment),
    ],
  });
}
