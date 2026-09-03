import {
  DEFAULT_APPROVAL_FLOW,
  normalizeApprovalFlow,
  parseApprovalFlow,
  type ApprovalFlowConfig,
} from "./recruitment-approval-flow";
import type { CompanySlug } from "./types";
import { getSupabaseBrowserClient } from "./supabase/client";

export { DEFAULT_APPROVAL_FLOW, type ApprovalFlowConfig, type ApprovalMember } from "./recruitment-approval-flow";

const STORAGE_KEY = (slug: CompanySlug) => `hr-approval-process:${slug}`;

export function validateApprovalFlow(flow: ApprovalFlowConfig) {
  const next = normalizeApprovalFlow(flow);
  if (next.hrApprovers.length === 0) {
    throw new Error("Add at least one HR approver.");
  }
  if (next.handleMembers.length === 0) {
    throw new Error("Add at least one Handle member.");
  }
  return next;
}

export async function loadApprovalFlow(slug: CompanySlug) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("recruitment_approval_settings")
        .select("leader_cc, hr_approvers, handle_members")
        .eq("company_slug", slug)
        .maybeSingle();
      if (!error && data) {
        const parsed = parseApprovalFlow({
          leaderCc: data.leader_cc,
          hrApprovers: data.hr_approvers,
          handleMembers: data.handle_members,
        });
        if (parsed) return parsed;
      }
    }
  } catch {
    /* use local */
  }

  if (typeof window === "undefined") return DEFAULT_APPROVAL_FLOW;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    return parseApprovalFlow(raw) ?? DEFAULT_APPROVAL_FLOW;
  } catch {
    return DEFAULT_APPROVAL_FLOW;
  }
}

export async function saveApprovalFlow(slug: CompanySlug, flow: ApprovalFlowConfig) {
  const next = validateApprovalFlow(flow);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(next));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return next;

  const { error } = await supabase.from("recruitment_approval_settings").upsert(
    {
      company_slug: slug,
      leader_cc: next.leaderCc,
      hr_approvers: next.hrApprovers,
      handle_members: next.handleMembers,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_slug" },
  );
  if (error && !/recruitment_approval_settings|schema cache|does not exist/i.test(error.message)) {
    throw error;
  }
  return next;
}
