"use client";

import { LarkPeoplePicker } from "@/components/lark-people-picker";
import { Field } from "@/components/ui";
import {
  DEFAULT_APPROVAL_FLOW,
  loadApprovalFlow,
  saveApprovalFlow,
  type ApprovalFlowConfig,
} from "@/lib/recruitment-approval-settings";
import { useRecruitment } from "@/lib/recruitment-context";
import { useEffect, useState } from "react";

export function ApprovalProcessSettings() {
  const { slug } = useRecruitment();
  const [flow, setFlow] = useState<ApprovalFlowConfig>(DEFAULT_APPROVAL_FLOW);
  const [sourceSlug, setSourceSlug] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadApprovalFlow(slug).then((next) => {
      if (cancelled) return;
      setFlow(next);
      setSourceSlug(slug);
      setError("");
      setSuccess("");
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (sourceSlug !== slug) {
    return <p className="text-sm text-muted">Loading approval process…</p>;
  }

  return (
    <form
      className="space-y-5 rounded-[24px] border border-line bg-paper-raised p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");
        try {
          const saved = await saveApprovalFlow(slug, flow);
          setFlow(saved);
          setSuccess("Approval process saved. New requests use this flow.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not save approval process.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-medium">Approval process</h2>
        <p className="mt-1 text-sm text-muted">
          Customize who is CC’d after Business Leader agrees, who can do HR
          Approval, and who can Handle. New requests snapshot this list.
        </p>
      </div>

      <Field label="Business Leader — CC when agreed">
        <p className="-mt-1 text-xs text-muted">
          Optional. These people are notified after the selected N+1 approves.
        </p>
        <LarkPeoplePicker
          value={flow.leaderCc}
          onChange={(leaderCc) => setFlow((current) => ({ ...current, leaderCc }))}
          placeholder="Add CC recipients"
        />
      </Field>

      <Field label="HR Approval">
        <p className="-mt-1 text-xs text-muted">
          One or more people. Anyone assigned can approve.
        </p>
        <LarkPeoplePicker
          value={flow.hrApprovers}
          onChange={(hrApprovers) => setFlow((current) => ({ ...current, hrApprovers }))}
          placeholder="Add HR approvers"
        />
      </Field>

      <Field label="Handle">
        <p className="-mt-1 text-xs text-muted">
          One or more people. Anyone assigned can complete this step.
        </p>
        <LarkPeoplePicker
          value={flow.handleMembers}
          onChange={(handleMembers) => setFlow((current) => ({ ...current, handleMembers }))}
          placeholder="Add handlers"
        />
      </Field>

      {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save approval process"}
        </button>
        <button
          type="button"
          onClick={() => setFlow(DEFAULT_APPROVAL_FLOW)}
          className="rounded-full px-4 py-2.5 text-sm text-muted hover:bg-paper hover:text-ink"
        >
          Reset to default
        </button>
      </div>
    </form>
  );
}
