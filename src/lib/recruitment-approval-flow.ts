export type ApprovalStep = "leader" | "hr" | "handle" | "done";

export type ApprovalMember = {
  name: string;
  id: string;
};

export type ApprovalFlowConfig = {
  leaderCc: ApprovalMember[];
  hrApprovers: ApprovalMember[];
  handleMembers: ApprovalMember[];
};

export const DEFAULT_APPROVAL_FLOW: ApprovalFlowConfig = {
  leaderCc: [
    { name: "Fitria Latifanisa", id: "" },
    { name: "Nesya Wulaningtias", id: "" },
    { name: "Lelyta Nugraheni", id: "" },
    { name: "Caca", id: "" },
  ],
  hrApprovers: [
    { name: "Lelyta Nugraheni", id: "" },
    { name: "Fitria Latifanisa", id: "" },
  ],
  handleMembers: [
    { name: "Caca", id: "" },
    { name: "Nesya Wulaningtias", id: "" },
    { name: "Lelyta Nugraheni", id: "" },
    { name: "Fitria Latifanisa", id: "" },
  ],
};

export const HR_APPROVERS = DEFAULT_APPROVAL_FLOW.hrApprovers.map((item) => item.name);
export const HANDLE_MEMBERS = DEFAULT_APPROVAL_FLOW.handleMembers.map((item) => item.name);
export const LEADER_CC_RECIPIENTS = DEFAULT_APPROVAL_FLOW.leaderCc.map((item) => item.name);

export const APPROVAL_STEP_LABELS: Record<ApprovalStep, string> = {
  leader: "Business Leader Approval",
  hr: "HR Approval",
  handle: "Handle",
  done: "Completed",
};

export function parseApprovalStep(value: unknown): ApprovalStep {
  if (value === "leader" || value === "hr" || value === "handle" || value === "done") {
    return value;
  }
  return "leader";
}

export function nextApprovalStep(step: ApprovalStep): ApprovalStep {
  if (step === "leader") return "hr";
  if (step === "hr") return "handle";
  return "done";
}

export function normalizeApprovalMembers(values: ApprovalMember[]) {
  const seen = new Set<string>();
  const next: ApprovalMember[] = [];
  for (const raw of values) {
    const name = raw.name.trim();
    const id = raw.id.trim();
    if (!name && !id) continue;
    const key = id || name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ name: name || id, id });
  }
  return next;
}

export function normalizeApprovalFlow(value: Partial<ApprovalFlowConfig> | null | undefined) {
  return {
    leaderCc: normalizeApprovalMembers(value?.leaderCc ?? DEFAULT_APPROVAL_FLOW.leaderCc),
    hrApprovers: normalizeApprovalMembers(value?.hrApprovers ?? DEFAULT_APPROVAL_FLOW.hrApprovers),
    handleMembers: normalizeApprovalMembers(value?.handleMembers ?? DEFAULT_APPROVAL_FLOW.handleMembers),
  } satisfies ApprovalFlowConfig;
}

function parseMember(value: unknown): ApprovalMember | null {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name, id: "" } : null;
  }
  if (!value || typeof value !== "object") return null;
  const row = value as { name?: unknown; id?: unknown };
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!name && !id) return null;
  return { name: name || id, id };
}

export function parseApprovalFlow(value: unknown): ApprovalFlowConfig | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return parseApprovalFlow(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof value !== "object") return null;
  const row = value as {
    leaderCc?: unknown;
    hrApprovers?: unknown;
    handleMembers?: unknown;
  };
  const leaderCc = Array.isArray(row.leaderCc) ? row.leaderCc.map(parseMember).filter(Boolean) : null;
  const hrApprovers = Array.isArray(row.hrApprovers)
    ? row.hrApprovers.map(parseMember).filter(Boolean)
    : null;
  const handleMembers = Array.isArray(row.handleMembers)
    ? row.handleMembers.map(parseMember).filter(Boolean)
    : null;
  if (!leaderCc && !hrApprovers && !handleMembers) return null;
  return normalizeApprovalFlow({
    leaderCc: leaderCc as ApprovalMember[] | undefined,
    hrApprovers: hrApprovers as ApprovalMember[] | undefined,
    handleMembers: handleMembers as ApprovalMember[] | undefined,
  });
}

export function serializeApprovalFlow(flow: ApprovalFlowConfig) {
  return JSON.stringify(normalizeApprovalFlow(flow));
}

export function flowFromPayload(
  payload: Record<string, string>,
  fallback: ApprovalFlowConfig = DEFAULT_APPROVAL_FLOW,
) {
  return parseApprovalFlow(payload.approval_flow) ?? fallback;
}

export function memberNames(members: ApprovalMember[]) {
  return members.map((item) => item.name).filter(Boolean);
}

export function approvalProcessPreview(
  leaderName: string,
  flow: ApprovalFlowConfig = DEFAULT_APPROVAL_FLOW,
) {
  const leader = leaderName.trim() || "Requester selects approver";
  const cc = memberNames(flow.leaderCc);
  const hr = memberNames(flow.hrApprovers);
  const handle = memberNames(flow.handleMembers);
  return [
    {
      id: "leader" as const,
      title: APPROVAL_STEP_LABELS.leader,
      detail: cc.length ? `${leader} · CC when agreed: ${cc.join(", ")}` : leader,
    },
    {
      id: "hr" as const,
      title: APPROVAL_STEP_LABELS.hr,
      detail: `${hr.join(", ") || "No HR approvers set"} · anyone assigned`,
    },
    {
      id: "handle" as const,
      title: APPROVAL_STEP_LABELS.handle,
      detail: `${handle.join(", ") || "No handlers set"} · anyone assigned`,
    },
  ];
}

export function approvalStatusLabel(status: string, step: ApprovalStep) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (step === "done") return "Pending";
  return `Pending · ${APPROVAL_STEP_LABELS[step]}`;
}

export type ApprovalViewer = {
  name: string;
  email: string;
};

const MEMBER_ALIASES: Record<string, string[]> = {
  caca: ["caca", "umaya", "umaya adisti"],
  "fitria latifanisa": ["fitria latifanisa", "fitria"],
  "lelyta nugraheni": ["lelyta nugraheni", "lelyta"],
  "nesya wulaningtias": ["nesya wulaningtias", "nesya"],
};

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

function viewerTokens(viewer: ApprovalViewer) {
  const email = normalizeIdentity(viewer.email);
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "";
  const name = normalizeIdentity(viewer.name);
  return [email, local, name].filter(Boolean);
}

export function viewerMatchesLabel(viewer: ApprovalViewer | null, label: string) {
  if (!viewer) return false;
  const hay = normalizeIdentity(label);
  if (!hay) return false;
  const tokens = viewerTokens(viewer);
  if (tokens.some((token) => token.length >= 3 && hay.includes(token))) return true;
  if (tokens.some((token) => token.split(/\s+/).some((part) => part.length >= 3 && hay.includes(part)))) {
    return true;
  }
  for (const [canonical, aliases] of Object.entries(MEMBER_ALIASES)) {
    const labelHits = hay.includes(canonical) || aliases.some((alias) => hay.includes(alias));
    const viewerHits = tokens.some((token) =>
      token.includes(canonical) || aliases.some((alias) => token.includes(alias)),
    );
    if (labelHits && viewerHits) return true;
  }
  return false;
}

export function assigneesForStep(
  step: ApprovalStep,
  payload: Record<string, string>,
  fallback: ApprovalFlowConfig = DEFAULT_APPROVAL_FLOW,
) {
  const flow = flowFromPayload(payload, fallback);
  if (step === "leader") {
    return [payload.direct_supervisor].filter((value) => Boolean(value?.trim()));
  }
  if (step === "hr") return memberNames(flow.hrApprovers);
  if (step === "handle") return memberNames(flow.handleMembers);
  return [];
}

export function canDecideCurrentStep(
  viewer: ApprovalViewer | null,
  step: ApprovalStep,
  payload: Record<string, string>,
  fallback: ApprovalFlowConfig = DEFAULT_APPROVAL_FLOW,
) {
  if (step === "done") return false;
  if (!viewer) return true;
  return assigneesForStep(step, payload, fallback).some((label) =>
    viewerMatchesLabel(viewer, label),
  );
}

export function waitingCopy(step: Exclude<ApprovalStep, "done">) {
  if (step === "leader") {
    return "Awaiting Business Leader approval. Later steps unlock after this is approved.";
  }
  if (step === "hr") {
    return "Awaiting HR approval. Handle starts after this is approved.";
  }
  return "Awaiting Handle. This is the last step.";
}
