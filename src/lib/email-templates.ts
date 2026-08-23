import { formatSheetDate } from "./format";
import type { ApplicationView, CompanySlug } from "./types";

export const EMAIL_TEMPLATE_KINDS = [
  "interview",
  "user-interview",
  "studi-case",
  "offering",
] as const;

export type EmailTemplateKind = (typeof EMAIL_TEMPLATE_KINDS)[number];

export type EmailAttachment = {
  name: string;
  url: string;
  type: string;
};

export type EmailTemplate = {
  kind: EmailTemplateKind;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
};

export const EMAIL_TEMPLATE_META: Record<
  EmailTemplateKind,
  { label: string; hint: string }
> = {
  interview: {
    label: "Interview",
    hint: "HR interview invitation",
  },
  "user-interview": {
    label: "User Interview",
    hint: "Hiring-team interview invitation",
  },
  "studi-case": {
    label: "Studi Case",
    hint: "Case study brief for the candidate",
  },
  offering: {
    label: "Offering Letter",
    hint: "Offer email with the letter attached",
  },
};

export const EMAIL_FILE_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";
export const EMAIL_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const EMAIL_FILE_MAX_COUNT = 4;

const STORAGE_KEY = (slug: CompanySlug) => `hr-email-templates:${slug}`;

export function defaultTemplates(companyName: string): EmailTemplate[] {
  const templates: EmailTemplate[] = [
    {
      kind: "interview",
      subject: `Invitation to HR Interview — {{role}} at {{company}}`,
      body: `Hi {{candidate_name}},

Thank you for applying for the {{role}} role at {{company}}. We would like to invite you to an HR interview.

Please reply with your availability over the next few days so we can lock in a time.{{interview_line}}

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
    {
      kind: "user-interview",
      subject: `Invitation to User Interview — {{role}} at {{company}}`,
      body: `Hi {{candidate_name}},

Thank you for speaking with our Talent team. We would like to invite you to a user interview for the {{role}} role at {{company}}.

This conversation will be with the hiring team. We will share the schedule and any preparation notes shortly.{{interview_line}}

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
    {
      kind: "studi-case",
      subject: `Studi Case — {{role}} at {{company}}`,
      body: `Hi {{candidate_name}},

Thank you for the conversation so far. As the next step for the {{role}} role at {{company}}, we would like you to complete a studi case.

Please find the brief attached. Reply to this email if anything is unclear, and send your work back by the agreed deadline.

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
    {
      kind: "offering",
      subject: `Offer of Employment — {{role}} at {{company}}`,
      body: `Hi {{candidate_name}},

We are delighted to offer you the {{role}} position at {{company}}.

Please find the offering letter attached. Review the details, and reply to this email if anything needs clarifying. We would love to welcome you to the team.

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
  ];

  return templates.map((template) => ({
    ...template,
    subject: template.subject.replaceAll("{{company}}", companyName),
  }));
}

export function loadTemplates(slug: CompanySlug, companyName: string) {
  const fallback = defaultTemplates(companyName);
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as EmailTemplate[];
    return fallback.map((item) => {
      const saved = parsed.find((entry) => entry.kind === item.kind);
      if (!saved) return item;
      return {
        ...item,
        subject: saved.subject || item.subject,
        body: saved.body || item.body,
        attachments: Array.isArray(saved.attachments) ? saved.attachments : [],
      };
    });
  } catch {
    return fallback;
  }
}

export function saveTemplates(slug: CompanySlug, templates: EmailTemplate[]) {
  window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(templates));
}

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function templateVars(
  item: ApplicationView,
  companyName: string,
  kind: EmailTemplateKind,
) {
  const date =
    kind === "user-interview"
      ? item.user_interview_date
      : kind === "interview"
        ? item.hr_interview_date
        : null;
  const formatted = date ? formatSheetDate(date) : "";

  return {
    candidate_name: item.candidate.full_name,
    role: item.job.title,
    company: companyName,
    interview_line: formatted ? `\n\nProposed date: ${formatted}.` : "",
    interview_date: formatted,
  };
}

export function suggestedTemplate(item: ApplicationView): EmailTemplateKind {
  if (
    item.latest_status === "Offering" ||
    item.latest_status === "Offer Accepted" ||
    item.stage === "offer"
  ) {
    return "offering";
  }
  if (item.job.status_vacancy === "Study Case") {
    return "studi-case";
  }
  if (
    item.latest_status === "User Interview" ||
    item.latest_status === "3rd Interview"
  ) {
    return "user-interview";
  }
  return "interview";
}

export function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function utf8ToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function encodeHeader(value: string) {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${utf8ToBase64(value)}?=`;
}

function foldBase64(value: string) {
  return value.replace(/(.{76})/g, "$1\r\n");
}

async function attachmentPayload(file: EmailAttachment) {
  if (file.url.startsWith("data:")) {
    const comma = file.url.indexOf(",");
    const header = comma === -1 ? file.url : file.url.slice(0, comma);
    const data = comma === -1 ? "" : file.url.slice(comma + 1);
    const mime = header.slice(5).split(";")[0] || file.type || "application/octet-stream";
    const base64 = header.includes("base64") ? data : utf8ToBase64(decodeURIComponent(data));
    return { name: file.name, type: mime, base64 };
  }

  const response = await fetch(file.url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return {
    name: file.name,
    type: file.type || response.headers.get("content-type") || "application/octet-stream",
    base64: btoa(binary),
  };
}

export async function buildEmlFile(input: {
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
}) {
  const boundary = `=_hr_${crypto.randomUUID().replaceAll("-", "")}`;
  const chunks = [
    `MIME-Version: 1.0`,
    `Date: ${new Date().toUTCString()}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.subject)}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    input.body.replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"),
  ];

  for (const file of input.attachments) {
    const payload = await attachmentPayload(file);
    const safeName = payload.name.replaceAll('"', "");
    chunks.push(
      ``,
      `--${boundary}`,
      `Content-Type: ${payload.type}; name="${safeName}"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="${safeName}"`,
      ``,
      foldBase64(payload.base64),
    );
  }

  chunks.push(``, `--${boundary}--`, ``);
  return chunks.join("\r\n");
}

export function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fileToAttachment(file: File): Promise<EmailAttachment> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    url,
    type: file.type || "application/octet-stream",
  };
}
