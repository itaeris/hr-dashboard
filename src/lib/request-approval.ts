import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseApprovalStatus,
  type ApprovalStatus,
  type StoredRecruitmentRequest,
} from "./request-approval-types";

export type { ApprovalStatus, StoredRecruitmentRequest };

function fromRow(row: Record<string, unknown>): StoredRecruitmentRequest {
  const payload =
    row.payload && typeof row.payload === "object"
      ? (row.payload as Record<string, string>)
      : {};
  return {
    id: String(row.id ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString()),
    company: String(row.company ?? payload.company ?? ""),
    payload,
    approval_status: parseApprovalStatus(row.approval_status ?? payload.approval_status),
    approval_comment: String(row.approval_comment ?? payload.approval_comment ?? ""),
    approval_decided_at:
      typeof row.approval_decided_at === "string" ? row.approval_decided_at : null,
    approval_decided_by: String(row.approval_decided_by ?? payload.approval_decided_by ?? ""),
  };
}

export async function loadRecruitmentRequest(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("recruitment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return fromRow(data as Record<string, unknown>);
}

export async function saveRecruitmentApproval(
  id: string,
  patch: {
    approval_status: ApprovalStatus;
    approval_comment: string;
    approval_decided_by: string;
  },
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");

  const current = await loadRecruitmentRequest(id);
  if (!current) throw new Error("Request not found.");

  const decided_at = new Date().toISOString();
  const payload = {
    ...current.payload,
    approval_status: patch.approval_status,
    approval_comment: patch.approval_comment,
    approval_decided_by: patch.approval_decided_by,
  };

  const withColumns = await supabase
    .from("recruitment_requests")
    .update({
      payload,
      approval_status: patch.approval_status,
      approval_comment: patch.approval_comment,
      approval_decided_at: decided_at,
      approval_decided_by: patch.approval_decided_by,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (!withColumns.error && withColumns.data) {
    return fromRow(withColumns.data as Record<string, unknown>);
  }

  const fallback = await supabase
    .from("recruitment_requests")
    .update({ payload })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (fallback.error || !fallback.data) {
    throw new Error(withColumns.error?.message ?? "Could not save approval.");
  }
  return fromRow(fallback.data as Record<string, unknown>);
}
