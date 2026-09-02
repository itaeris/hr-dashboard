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
