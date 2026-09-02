export type ApprovalStatus = "pending" | "approved" | "rejected";

export type StoredRecruitmentRequest = {
  id: string;
  created_at: string;
  company: string;
  payload: Record<string, string>;
  approval_status: ApprovalStatus;
  approval_comment: string;
  approval_decided_at: string | null;
  approval_decided_by: string;
};

export function parseApprovalStatus(value: unknown): ApprovalStatus {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return "pending";
}
