export type ApprovalStep = "leader" | "hr" | "handle" | "done";

export const HR_APPROVERS = ["Lelyta Nugraheni", "Fitria Latifanisa"] as const;

export const HANDLE_MEMBERS = [
  "Caca",
  "Nesya Wulaningtias",
  "Lelyta Nugraheni",
  "Fitria Latifanisa",
] as const;

export const LEADER_CC_RECIPIENTS = [
  "Fitria Latifanisa",
  "Nesya Wulaningtias",
  "Lelyta Nugraheni",
  "Caca",
] as const;

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

export function approvalProcessPreview(leaderName: string) {
  const leader = leaderName.trim() || "Requester selects approver";
  return [
    {
      id: "leader" as const,
      title: APPROVAL_STEP_LABELS.leader,
      detail: `${leader} · CC when agreed: ${LEADER_CC_RECIPIENTS.join(", ")}`,
    },
    {
      id: "hr" as const,
      title: APPROVAL_STEP_LABELS.hr,
      detail: `${HR_APPROVERS.join(", ")} · anyone assigned`,
    },
    {
      id: "handle" as const,
      title: APPROVAL_STEP_LABELS.handle,
      detail: `${HANDLE_MEMBERS.join(", ")} · anyone assigned`,
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
) {
  if (step === "leader") {
    return [payload.direct_supervisor].filter((value) => Boolean(value?.trim()));
  }
  if (step === "hr") return [...HR_APPROVERS];
  if (step === "handle") return [...HANDLE_MEMBERS];
  return [];
}

export function canDecideCurrentStep(
  viewer: ApprovalViewer | null,
  step: ApprovalStep,
  payload: Record<string, string>,
) {
  if (step === "done") return false;
  if (!viewer) return true;
  return assigneesForStep(step, payload).some((label) => viewerMatchesLabel(viewer, label));
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
