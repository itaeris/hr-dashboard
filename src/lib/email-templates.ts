import { COMPANY_EMAIL_LOGOS, EMAIL_LOGO_CID, emailBodyHtml } from "./email/signature";
import { formatSheetDate, formatWelcomeDate } from "./format";
import { suggestedWorkEmail } from "./onboarding";
import { getSupabaseBrowserClient } from "./supabase/client";
import type { ApplicationView, CompanySlug } from "./types";

export const EMAIL_TEMPLATE_KINDS = [
  "interview",
  "user-interview",
  "studi-case",
  "offering",
  "rejected",
  "onboarding-welcome",
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
  cc: string;
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
  rejected: {
    label: "Rejected",
    hint: "Polite decline after the process",
  },
  "onboarding-welcome": {
    label: "Onboarding Welcoming",
    hint: "Welcome email with start date, credentials, and office info",
  },
};

export const EMAIL_FILE_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";
export const EMAIL_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const EMAIL_FILE_MAX_COUNT = 4;

const STORAGE_KEY = (slug: CompanySlug) => `hr-email-templates:${slug}`;

function mergeTemplates(fallback: EmailTemplate[], parsed: EmailTemplate[]) {
  return fallback.map((item) => {
    const saved = parsed.find((entry) => entry.kind === item.kind);
    if (!saved) return item;
    return {
      ...item,
      subject: saved.subject || item.subject,
      body: saved.body || item.body,
      cc: typeof saved.cc === "string" ? saved.cc : "",
      attachments: Array.isArray(saved.attachments) ? saved.attachments : [],
    };
  });
}

function readLocalTemplates(slug: CompanySlug, fallback: EmailTemplate[]) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    if (!raw) return fallback;
    return mergeTemplates(fallback, JSON.parse(raw) as EmailTemplate[]);
  } catch {
    return fallback;
  }
}

export function loadTemplatesCached(slug: CompanySlug, companyName: string) {
  return readLocalTemplates(slug, defaultTemplates(companyName));
}

export async function loadTemplates(slug: CompanySlug, companyName: string) {
  const fallback = defaultTemplates(companyName);
  const local = readLocalTemplates(slug, fallback);

  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("email_templates")
        .select("templates")
        .eq("company_slug", slug)
        .maybeSingle();
      if (!error && Array.isArray(data?.templates) && data.templates.length > 0) {
        const merged = mergeTemplates(fallback, data.templates as EmailTemplate[]);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(merged));
        }
        return merged;
      }
      if (!error && local !== fallback) {
        await saveTemplates(slug, local);
      }
    }
  } catch {
    /* use local */
  }

  return local;
}

export function saveTemplatesCached(slug: CompanySlug, templates: EmailTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(templates));
}

export async function saveTemplates(slug: CompanySlug, templates: EmailTemplate[]) {
  saveTemplatesCached(slug, templates);

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("email_templates").upsert(
    {
      company_slug: slug,
      templates,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_slug" },
  );
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return;
    }
    throw error;
  }
}

export function defaultTemplates(companyName: string) {
  const templates: EmailTemplate[] = [
    {
      kind: "interview",
      subject: `Invitation to HR Interview — {{role}} at {{company}}`,
      cc: "",
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
      cc: "",
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
      cc: "",
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
      cc: "",
      body: `Hi {{candidate_name}},

We are delighted to offer you the {{role}} position at {{company}}.

Please find the offering letter attached. Review the details, and reply to this email if anything needs clarifying. We would love to welcome you to the team.

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
    {
      kind: "rejected",
      subject: `Update on your application — {{role}} at {{company}}`,
      cc: "",
      body: `Hi {{candidate_name}},

Thank you for your interest in the {{role}} role at {{company}}, and for the time you spent with our team.

After careful consideration, we have decided not to move forward with your application. This was not an easy decision, and we truly appreciate the effort you put into the process.

We wish you all the best in your next opportunity.

Warm regards,
{{company}} Talent Team`,
      attachments: [],
    },
    {
      kind: "onboarding-welcome",
      subject: `Welcome to the Team! — {{company}}`,
      cc: "",
      body: `Dear {{candidate_name}},

We are all really excited to welcome you to our team! As agreed, your start date is {{join_date}}. We expect you to be in our offices by {{start_time}} and our dress code is {{dress_code}}.

You can activate your working email in this credentials

AERIS
Username: {{aeris_email}}
Password: {{aeris_password}}

FROM THIS ISLAND
Username: {{fti_email}}
Password: {{fti_password}}

We've planned your first days to help you settle in properly. You can find more details in the On Boarding Session on your very first day at the office with our HR team.

Location:
AERIS | KIN | FTI Head Office
Jl. Tanjung Duren Raya No. 24, more info here: https://maps.google.com/?q=Jl.+Tanjung+Duren+Raya+No.+24,+Jakarta+Barat+11470

We are all excited to meet you and look forward to introducing ourselves to you!

If you have any questions prior to your arrival, please feel free to email or call and I'll be more than happy to help you.

We are looking forward to working with you and seeing you achieve great things!

Best regards,
Human Resources`,
      attachments: [],
    },
  ];

  return templates.map((template) => ({
    ...template,
    subject: template.subject.replaceAll("{{company}}", companyName),
  }));
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
  const name = item.candidate.full_name;

  return {
    candidate_name: name,
    role: item.job.title,
    company: companyName,
    interview_line: formatted ? `\n\nProposed date: ${formatted}.` : "",
    interview_date: formatted,
    join_date: formatWelcomeDate(item.join_date) || "TBC",
    start_time: "09.00 AM",
    dress_code: "casual",
    aeris_email: suggestedWorkEmail(name, "aeris-beaute"),
    aeris_password: "",
    fti_email: suggestedWorkEmail(name, "from-this-island"),
    fti_password: "",
  };
}

export function suggestedTemplate(item: ApplicationView): EmailTemplateKind {
  if (
    item.stage === "rejected" ||
    item.latest_status === "Dropped" ||
    item.latest_status === "Rejected" ||
    item.latest_status === "Offer Rejected"
  ) {
    return "rejected";
  }
  if (
    item.offer_result === "Offer Accepted" ||
    item.latest_status === "Offer Accepted" ||
    item.latest_status === "Joined" ||
    item.stage === "hired"
  ) {
    return "onboarding-welcome";
  }
  if (item.latest_status === "Offering" || item.stage === "offer") {
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

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseCcAddresses(value: string) {
  return value
    .split(/[,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ccAddressesError(value: string) {
  const addresses = parseCcAddresses(value);
  if (addresses.length > 8) return "Use at most 8 CC addresses.";
  if (addresses.some((entry) => entry.length > 254 || !EMAIL_ADDRESS.test(entry))) {
    return "Enter valid CC emails, separated by commas.";
  }
  return "";
}

export function gmailComposeUrl(
  to: string,
  subject: string,
  body: string,
  cc = "",
) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body,
  });
  const copied = parseCcAddresses(cc).join(",");
  if (copied) params.set("cc", copied);
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

async function logoPayload(slug: CompanySlug) {
  const logo = COMPANY_EMAIL_LOGOS[slug];
  const response = await fetch(logo.publicPath);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return {
    name: logo.fileName.replaceAll('"', ""),
    type: response.headers.get("content-type") || "image/png",
    base64: btoa(binary),
  };
}

export async function buildEmlFile(input: {
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  company: CompanySlug;
  cc?: string;
}) {
  const mixed = `=_hr_mixed_${crypto.randomUUID().replaceAll("-", "")}`;
  const related = `=_hr_related_${crypto.randomUUID().replaceAll("-", "")}`;
  const alt = `=_hr_alt_${crypto.randomUUID().replaceAll("-", "")}`;
  const logo = await logoPayload(input.company);
  const html = emailBodyHtml(input.body, input.company);
  const copied = parseCcAddresses(input.cc ?? "").join(", ");
  const chunks = [
    `MIME-Version: 1.0`,
    `Date: ${new Date().toUTCString()}`,
    `To: ${input.to}`,
    ...(copied ? [`Cc: ${copied}`] : []),
    `Subject: ${encodeHeader(input.subject)}`,
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    ``,
    `--${mixed}`,
    `Content-Type: multipart/related; boundary="${related}"`,
    ``,
    `--${related}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    ``,
    `--${alt}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    input.body.replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"),
    ``,
    `--${alt}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    html.replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"),
    ``,
    `--${alt}--`,
    ``,
    `--${related}`,
    `Content-Type: ${logo.type}; name="${logo.name}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: inline; filename="${logo.name}"`,
    `Content-ID: <${EMAIL_LOGO_CID}>`,
    ``,
    foldBase64(logo.base64),
    ``,
    `--${related}--`,
  ];

  for (const file of input.attachments) {
    const payload = await attachmentPayload(file);
    const safeName = payload.name.replaceAll('"', "");
    chunks.push(
      ``,
      `--${mixed}`,
      `Content-Type: ${payload.type}; name="${safeName}"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="${safeName}"`,
      ``,
      foldBase64(payload.base64),
    );
  }

  chunks.push(``, `--${mixed}--`, ``);
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
