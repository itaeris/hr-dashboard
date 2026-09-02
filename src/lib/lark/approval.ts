import "server-only";

import { publicSiteUrl } from "@/lib/auth/google";
import { isLarkConfigured, listLarkUsers, larkPost } from "@/lib/lark/client";
import { findLarkUser } from "@/lib/lark/users";

export function larkApprovalCode() {
  return process.env.LARK_APPROVAL_CODE?.trim() || "hr_recruitment_request";
}

export function requestFormUrl() {
  return `${publicSiteUrl()}/recruitment-request`;
}

export function requestApprovalUrl(id: string) {
  return `${publicSiteUrl()}/recruitment-request/approval/${id}`;
}

function texts(entries: Record<string, string>) {
  return Object.entries(entries).map(([key, value]) => ({ key, value }));
}

export async function ensureRecruitmentApprovalDefinition() {
  const form = requestFormUrl();
  await larkPost(
    "/open-apis/approval/v4/external_approvals",
    {
      approval_name: "@i18n@1",
      approval_code: larkApprovalCode(),
      group_code: "hr_recruitment",
      group_name: "@i18n@2",
      description: "@i18n@3",
      external: {
        biz_name: "@i18n@4",
        create_link_pc: form,
        create_link_mobile: form,
        support_pc: true,
        support_mobile: true,
        enable_quick_operate: false,
      },
      viewers: [{ viewer_type: "TENANT" }],
      i18n_resources: [
        {
          locale: "en-US",
          is_default: true,
          texts: texts({
            "@i18n@1": "HR Recruitment Request Form",
            "@i18n@2": "HR Recruitment",
            "@i18n@3": "Request a new or replacement hire.",
            "@i18n@4": "HR Dashboard",
          }),
        },
      ],
    },
    { user_id_type: "open_id" },
  );
}

export async function resolveLarkOpenId(...candidates: string[]) {
  if (!isLarkConfigured()) return "";
  const users = await listLarkUsers();
  for (const candidate of candidates) {
    const match = findLarkUser(users, candidate);
    if (match?.id) return match.id;
  }
  return "";
}

export async function syncRecruitmentApproval(input: {
  id: string;
  status: "pending" | "approved" | "rejected";
  jobPosition: string;
  company: string;
  department: string;
  supervisorName: string;
  supervisorOpenId: string;
  initiatorOpenId?: string;
  comment?: string;
}) {
  if (!isLarkConfigured()) {
    throw new Error("Lark is not configured.");
  }
  if (!input.supervisorOpenId) {
    throw new Error("Direct supervisor is not a Lark user, so Approval cannot be notified.");
  }

  try {
    await ensureRecruitmentApprovalDefinition();
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not create the Lark approval definition.";
    throw new Error(
      `${message} If you already created a definition in Lark, copy its approval code into LARK_APPROVAL_CODE.`,
    );
  }

  const now = Date.now();
  const ended = input.status === "pending" ? 0 : now;
  const taskStatus =
    input.status === "approved" ? "APPROVED" : input.status === "rejected" ? "REJECTED" : "PENDING";
  const instanceStatus =
    input.status === "approved" ? "APPROVED" : input.status === "rejected" ? "REJECTED" : "PENDING";
  const link = requestApprovalUrl(input.id);
  const initiator = input.initiatorOpenId || input.supervisorOpenId;

  await larkPost("/open-apis/approval/v4/external_instances", {
    approval_code: larkApprovalCode(),
    instance_id: input.id,
    status: instanceStatus,
    display_method: "BROWSER",
    update_mode: "REPLACE",
    links: { pc_link: link, mobile_link: link },
    title: "@i18n@title",
    open_id: initiator,
    start_time: String(now),
    end_time: String(ended),
    update_time: String(now),
    form: [
      { name: "@i18n@position_label", value: "@i18n@position" },
      { name: "@i18n@company_label", value: "@i18n@company" },
      { name: "@i18n@department_label", value: "@i18n@department" },
    ],
    task_list: [
      {
        task_id: `${input.id}-n1`,
        open_id: input.supervisorOpenId,
        title: "@i18n@task",
        links: { pc_link: link, mobile_link: link },
        status: taskStatus,
        display_method: "BROWSER",
        create_time: String(now),
        end_time: String(ended),
        update_time: String(now),
        extra: input.comment
          ? JSON.stringify({ complete_reason: input.status, comment: input.comment })
          : undefined,
      },
    ],
    i18n_resources: [
      {
        locale: "en-US",
        is_default: true,
        texts: texts({
          "@i18n@title": `Hire ${input.jobPosition || "role"}`,
          "@i18n@task": "Direct Supervisor (N+1)",
          "@i18n@position_label": "Position",
          "@i18n@position": input.jobPosition || "—",
          "@i18n@company_label": "Company",
          "@i18n@company": input.company || "—",
          "@i18n@department_label": "Department",
          "@i18n@department": input.department || "—",
        }),
      },
    ],
  });
}
