import nodemailer from "nodemailer";
import type { EmailAttachment } from "@/lib/email-templates";

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

export async function sendSmtpMail(input: {
  to: string;
  subject: string;
  text: string;
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

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
    attachments: (input.attachments ?? []).map(toNodemailerAttachment),
  });
}
