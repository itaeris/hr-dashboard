import "server-only";

import {
  DEFAULT_APPROVAL_FLOW,
  parseApprovalFlow,
  type ApprovalFlowConfig,
} from "./recruitment-approval-flow";
import { getSupabaseServerClient } from "./supabase/server";
import type { CompanySlug } from "./types";

export async function loadApprovalFlowServer(slug: CompanySlug): Promise<ApprovalFlowConfig> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return DEFAULT_APPROVAL_FLOW;
  const { data, error } = await supabase
    .from("recruitment_approval_settings")
    .select("leader_cc, hr_approvers, handle_members")
    .eq("company_slug", slug)
    .maybeSingle();
  if (error || !data) return DEFAULT_APPROVAL_FLOW;
  return (
    parseApprovalFlow({
      leaderCc: data.leader_cc,
      hrApprovers: data.hr_approvers,
      handleMembers: data.handle_members,
    }) ?? DEFAULT_APPROVAL_FLOW
  );
}
