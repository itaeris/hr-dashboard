import "server-only";

import { publicSiteUrl } from "@/lib/auth/google";
import { isLarkConfigured, listLarkUsers, larkPost } from "@/lib/lark/client";
import { findLarkUser } from "@/lib/lark/users";
import {
  HANDLE_MEMBERS,
  HR_APPROVERS,
  LEADER_CC_RECIPIENTS,
  type ApprovalStep,
} from "@/lib/recruitment-approval-flow";
import type { ApprovalStatus, StoredRecruitmentRequest } from "@/lib/request-approval-types";

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

async function resolveLarkMembers(names: readonly string[]) {
  if (!isLarkConfigured() || names.length === 0) return [];
  const users = await listLarkUsers();
  const seen = new Set<string>();
  const resolved: { name: string; open_id: string }[] = [];
  for (const name of names) {
    const match = findLarkUser(users, name);
    if (!match?.id || seen.has(match.id)) continue;
    seen.add(match.id);
    resolved.push({ name: match.name, open_id: match.id });
  }
  return resolved;
}

type TaskStatus = "PENDING" | "APPROVED" | "REJECTED";

function stageOrder(step: ApprovalStep) {
  if (step === "leader") return 0;
  if (step === "hr") return 1;
  if (step === "handle") return 2;
  return 3;
}

function stageTaskStatus(
  stage: Exclude<ApprovalStep, "done">,
  step: ApprovalStep,
  overall: ApprovalStatus,
): TaskStatus | null {
  const mine = stageOrder(stage);
  const current = stageOrder(step);
  if (mine > current) return null;
  if (overall === "rejected") return mine < current ? "APPROVED" : "REJECTED";
  if (mine < current) return "APPROVED";
  return "PENDING";
}

export async function syncRecruitmentApproval(input: {
  id: string;
  status: ApprovalStatus;
  step: ApprovalStep;
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

  const [hrMembers, handleMembers, ccMembers] = await Promise.all([
    resolveLarkMembers(HR_APPROVERS),
    resolveLarkMembers(HANDLE_MEMBERS),
    resolveLarkMembers(LEADER_CC_RECIPIENTS),
  ]);
  if (hrMembers.length === 0) {
    throw new Error(
      `Could not find HR approvers in Lark (${HR_APPROVERS.join(", ")}).`,
    );
  }
  if (handleMembers.length === 0) {
    throw new Error(
      `Could not find Handle members in Lark (${HANDLE_MEMBERS.join(", ")}).`,
    );
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
  const instanceEnded = input.status === "pending" ? 0 : now;
  const instanceStatus =
    input.status === "approved" ? "APPROVED" : input.status === "rejected" ? "REJECTED" : "PENDING";
  const link = requestApprovalUrl(input.id);
  const initiator = input.initiatorOpenId || input.supervisorOpenId;
  const extra = input.comment
    ? JSON.stringify({ complete_reason: input.status, comment: input.comment })
    : undefined;

  const task = (
    taskId: string,
    openId: string,
    title: string,
    status: TaskStatus,
  ) => ({
    task_id: taskId,
    open_id: openId,
    title,
    links: { pc_link: link, mobile_link: link },
    status,
    display_method: "BROWSER" as const,
    create_time: String(now),
    end_time: String(status === "PENDING" ? 0 : now),
    update_time: String(now),
    extra: status === "PENDING" ? undefined : extra,
  });

  const taskList = [];
  const leaderStatus = stageTaskStatus("leader", input.step, input.status);
  if (leaderStatus) {
    taskList.push(
      task(`${input.id}-leader`, input.supervisorOpenId, "@i18n@task_leader", leaderStatus),
    );
  }

  const hrStatus = stageTaskStatus("hr", input.step, input.status);
  if (hrStatus) {
    for (const member of hrMembers) {
      taskList.push(task(`${input.id}-hr-${member.open_id}`, member.open_id, "@i18n@task_hr", hrStatus));
    }
  }

  const handleStatus = stageTaskStatus("handle", input.step, input.status);
  if (handleStatus) {
    for (const member of handleMembers) {
      taskList.push(
        task(`${input.id}-handle-${member.open_id}`, member.open_id, "@i18n@task_handle", handleStatus),
      );
    }
  }

  const includeCc = input.step !== "leader";
  const ccList = includeCc
    ? ccMembers.map((member) => ({
        cc_id: `${input.id}-cc-${member.open_id}`,
        open_id: member.open_id,
        links: { pc_link: link, mobile_link: link },
        read_status: "UNREAD",
        title: "@i18n@cc",
        create_time: String(now),
        update_time: String(now),
      }))
    : [];

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
    end_time: String(instanceEnded),
    update_time: String(now),
    form: [
      { name: "@i18n@position_label", value: "@i18n@position" },
      { name: "@i18n@company_label", value: "@i18n@company" },
      { name: "@i18n@department_label", value: "@i18n@department" },
    ],
    task_list: taskList,
    ...(ccList.length > 0 ? { cc_list: ccList } : {}),
    i18n_resources: [
      {
        locale: "en-US",
        is_default: true,
        texts: texts({
          "@i18n@title": `Hire ${input.jobPosition || "role"}`,
          "@i18n@task_leader": "Business Leader Approval",
          "@i18n@task_hr": "HR Approval",
          "@i18n@task_handle": "Handle",
          "@i18n@cc": "CC",
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

export async function syncStoredRecruitmentApproval(
  row: StoredRecruitmentRequest,
  initiatorCandidates: string[] = [],
) {
  const supervisorOpenId = await resolveLarkOpenId(
    row.payload.direct_supervisor_id ?? "",
    row.payload.direct_supervisor ?? "",
  );
  const initiatorOpenId = await resolveLarkOpenId(
    ...initiatorCandidates,
    supervisorOpenId,
  );
  await syncRecruitmentApproval({
    id: row.id,
    status: row.approval_status,
    step: row.approval_step,
    jobPosition: row.payload.job_position ?? "",
    company: row.company || row.payload.company || "",
    department: row.payload.department ?? "",
    supervisorName: row.payload.direct_supervisor ?? "",
    supervisorOpenId,
    initiatorOpenId,
    comment: row.approval_comment,
  });
}

export async function removeRecruitmentApproval(
  row: StoredRecruitmentRequest,
  initiatorCandidates: string[] = [],
) {
  if (!isLarkConfigured()) return;
  const supervisorOpenId = await resolveLarkOpenId(
    row.payload.direct_supervisor_id ?? "",
    row.payload.direct_supervisor ?? "",
  );
  const initiator =
    (await resolveLarkOpenId(...initiatorCandidates, supervisorOpenId)) || supervisorOpenId;
  if (!initiator) {
    throw new Error("Could not resolve a Lark user to remove the approval.");
  }

  const now = Date.now();
  const link = requestApprovalUrl(row.id);
  await larkPost("/open-apis/approval/v4/external_instances", {
    approval_code: larkApprovalCode(),
    instance_id: row.id,
    status: "DELETED",
    display_method: "BROWSER",
    update_mode: "REPLACE",
    links: { pc_link: link, mobile_link: link },
    title: "@i18n@title",
    open_id: initiator,
    start_time: String(now),
    end_time: String(now),
    update_time: String(now),
    extra: JSON.stringify({ complete_reason: "delete" }),
    form: [
      { name: "@i18n@position_label", value: "@i18n@position" },
      { name: "@i18n@company_label", value: "@i18n@company" },
      { name: "@i18n@department_label", value: "@i18n@department" },
    ],
    task_list: [],
    i18n_resources: [
      {
        locale: "en-US",
        is_default: true,
        texts: texts({
          "@i18n@title": `Hire ${row.payload.job_position || "role"}`,
          "@i18n@position_label": "Position",
          "@i18n@position": row.payload.job_position || "—",
          "@i18n@company_label": "Company",
          "@i18n@company": row.company || row.payload.company || "—",
          "@i18n@department_label": "Department",
          "@i18n@department": row.payload.department || "—",
        }),
      },
    ],
  });
}
