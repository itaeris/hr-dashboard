"use client";

import { formatTableDate } from "@/lib/format";
import {
  createOnboardingRequest,
  isOnboardingCandidate,
  itReady,
  laptopAppsComplete,
  mergeLaptopApps,
  requestKindLabel,
  requestStatusCopy,
  sentToIt,
  suggestedWorkEmail,
  syncReadyAt,
  workspaceDomain,
  type OnboardingRequest,
  type RequestKind,
} from "@/lib/onboarding";
import { useRecruitment } from "@/lib/recruitment-context";
import { useOnboarding } from "@/lib/use-onboarding";
import type { ApplicationView } from "@/lib/types";
import { useMemo, useState } from "react";
import { Avatar, PositionChip } from "./display";
import { IconCheck, IconLaptop, IconPlus } from "./icons";
import { ModalFrame, PageFade, Field, fieldClass, PasswordInput } from "./ui";
import { Pill } from "./data-table";

export function OnboardingItPage() {
  return <OnboardingBoard mode="it" />;
}

export function OnboardingJoinersPage() {
  return <OnboardingBoard mode="joiners" />;
}

function OnboardingBoard({ mode }: { mode: "it" | "joiners" }) {
  const { slug, views, userEmail, userRole, loading: rosterLoading } = useRecruitment();
  const { settings, requests, loading, saveRequest } = useOnboarding(slug);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [sentOk, setSentOk] = useState("");
  const desk = userRole === "it" ? "it" : "hr";

  const apps = settings?.laptop_apps ?? [];
  const byApplication = useMemo(
    () => new Map(requests.map((row) => [row.application_id, row])),
    [requests],
  );
  const hires = useMemo(
    () =>
      views
        .filter(isOnboardingCandidate)
        .sort(
          (a, b) =>
            new Date(a.join_date ?? a.updated_at).getTime() -
            new Date(b.join_date ?? b.updated_at).getTime(),
        ),
    [views],
  );

  const paired = useMemo(() => {
    return requests
      .map((row) => {
        const item = views.find((view) => view.id === row.application_id);
        if (!item) return null;
        return { item, row };
      })
      .filter((entry): entry is { item: ApplicationView; row: OnboardingRequest } => Boolean(entry));
  }, [requests, views]);

  const queue = hires.filter((item) => !byApplication.has(item.id));
  const active =
    desk === "it"
      ? paired
          .filter(({ row }) => sentToIt(row) && !itReady(row, apps))
          .sort(
            (a, b) =>
              new Date(b.row.requested_at ?? 0).getTime() -
              new Date(a.row.requested_at ?? 0).getTime(),
          )
      : hires
          .map((item) => {
            const row = byApplication.get(item.id);
            if (!row || itReady(row, apps)) return null;
            return { item, row };
          })
          .filter((entry): entry is { item: ApplicationView; row: OnboardingRequest } => Boolean(entry));
  const joiners =
    desk === "it"
      ? paired.filter(({ row }) => itReady(row, apps))
      : hires
          .map((item) => {
            const row = byApplication.get(item.id);
            if (!row || !itReady(row, apps)) return null;
            return { item, row };
          })
          .filter((entry): entry is { item: ApplicationView; row: OnboardingRequest } => Boolean(entry));

  async function startRequest(item: ApplicationView) {
    if (!settings) return;
    setBusyId(item.id);
    setNotice("");
    try {
      const row = await saveRequest(
        createOnboardingRequest(item, slug, apps, userEmail),
      );
      setSentOk("");
      setOpenId(row.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create the IT request.");
    } finally {
      setBusyId(null);
    }
  }

  if (rosterLoading || loading || !settings) {
    return (
      <PageFade className="space-y-4">
        <p className="text-sm text-muted">Loading onboarding…</p>
      </PageFade>
    );
  }

  const editing = [...active, ...joiners].find((entry) => entry.row.id === openId) ?? null;

  return (
    <PageFade className="space-y-5">
      <p className="text-sm text-muted">
        {mode === "it"
          ? desk === "it"
            ? "Work through laptop setup, Google Workspace, and Lark. HR sees the hire in New joiners once everything is Done."
            : "Send the request to the IT desk. It shows up in IT → Requests — no email is sent."
          : desk === "it"
            ? "Requests where laptop, Workspace email, and Lark are all Done."
            : "People whose IT setup is complete — laptop (with apps), work email, and Lark invitation."}
      </p>

      {notice ? <p className="text-sm text-[#E24B4A]">{notice}</p> : null}
      {sentOk ? <p className="text-sm text-accent">{sentOk}</p> : null}

      {mode === "it" ? (
        <>
          <section className={`grid gap-3 ${desk === "it" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {desk === "hr" ? <Stat label="Need IT request" value={queue.length} /> : null}
            <Stat label={desk === "it" ? "Open requests" : "With IT"} value={active.length} />
            <Stat label={desk === "it" ? "Ready" : "Ready to join"} value={joiners.length} />
          </section>

          {desk === "hr" ? (
            <section className="rounded-[24px] border border-line bg-paper-raised p-4 sm:p-5">
              <h2 className="font-display text-xl">Waiting for IT request</h2>
              <p className="mt-1 text-sm text-muted">
                Offer accepted / joining — not in the IT queue yet.
              </p>
              <div className="mt-4 space-y-2">
                {queue.length === 0 ? (
                  <p className="text-sm text-muted">No hires waiting for an IT request.</p>
                ) : (
                  queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-3 py-3"
                    >
                      <Avatar name={item.candidate.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.candidate.full_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <PositionChip title={item.job.title} />
                          <span className="text-xs text-muted">
                            Join {formatTableDate(item.join_date) || "TBC"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void startRequest(item)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                        Request IT
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="font-display text-xl">{desk === "it" ? "Open requests" : "IT in progress"}</h2>
            {active.length === 0 ? (
              <p className="text-sm text-muted">
                {desk === "it" ? "No requests waiting for IT." : "No open IT requests."}
              </p>
            ) : (
              active.map((entry) => (
                <RequestCard
                  key={entry.row.id}
                  item={entry.item}
                  row={entry.row}
                  apps={apps}
                  desk={desk}
                  onOpen={() => setOpenId(entry.row.id)}
                />
              ))
            )}
          </section>
        </>
      ) : (
        <section className="space-y-3">
          {joiners.length === 0 ? (
            <p className="text-sm text-muted">
              {desk === "it"
                ? "Nothing is fully provisioned yet. Finish laptop, Workspace, and Lark on Requests first."
                : "Nobody is ready yet. Complete laptop, Workspace email, and Lark on IT request first."}
            </p>
          ) : (
            joiners.map((entry) => (
              <RequestCard
                key={entry.row.id}
                item={entry.item}
                row={entry.row}
                apps={apps}
                joiner
                desk={desk}
                onOpen={() => setOpenId(entry.row.id)}
              />
            ))
          )}
        </section>
      )}

      <RequestEditor
        key={editing?.row.id ?? "closed"}
        open={Boolean(editing)}
        item={editing?.item ?? null}
        row={editing?.row ?? null}
        apps={apps}
        userEmail={userEmail}
        desk={desk}
        onClose={() => setOpenId(null)}
        onSave={async (row) => {
          await saveRequest(syncReadyAt(row, apps));
        }}
        onSent={(message) => {
          setNotice("");
          setSentOk(message);
          setOpenId(null);
        }}
      />
    </PageFade>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-line bg-paper-raised p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function RequestCard({
  item,
  row,
  apps,
  joiner = false,
  desk = "hr",
  onOpen,
}: {
  item: ApplicationView;
  row: OnboardingRequest;
  apps: string[];
  joiner?: boolean;
  desk?: "hr" | "it";
  onOpen: () => void;
}) {
  const laptopOk = !row.laptop_needed || (row.laptop_status === "done" && laptopAppsComplete(row, apps));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[24px] border border-line bg-paper-raised p-4 text-left sm:p-5"
    >
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={item.candidate.full_name} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.candidate.full_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PositionChip title={item.job.title} />
            <Pill>{requestKindLabel(row.request_kind)}</Pill>
            <span className="text-xs text-muted">
              Join {formatTableDate(item.join_date) || "TBC"}
            </span>
          </div>
          {row.work_email ? (
            <p className="mt-2 truncate text-sm text-muted">{row.work_email}</p>
          ) : null}
        </div>
        {joiner ? (
          <Pill tone="ok">Joined</Pill>
        ) : desk === "it" ? (
          <Pill>Open</Pill>
        ) : (
          <Pill>{row.requested_at ? "Sent to IT" : "Draft"}</Pill>
        )}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <CheckLine
          ok={laptopOk}
          label={row.laptop_needed ? (laptopOk ? "Laptop · Done" : "Laptop") : "Laptop not needed"}
        />
        <CheckLine
          ok={row.email_status === "done"}
          label={row.email_status === "done" ? "Workspace · Done" : "Workspace"}
        />
        <CheckLine
          ok={row.lark_status === "done"}
          label={row.lark_status === "done" ? "Lark · Done" : "Lark"}
        />
      </div>
    </button>
  );
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${ok ? "text-accent-deep" : "text-muted"}`}>
      <IconCheck className={`h-4 w-4 ${ok ? "opacity-100" : "opacity-30"}`} />
      {label}
    </span>
  );
}

function RequestEditor({
  open,
  item,
  row,
  apps,
  userEmail,
  desk,
  onClose,
  onSave,
  onSent,
}: {
  open: boolean;
  item: ApplicationView | null;
  row: OnboardingRequest | null;
  apps: string[];
  userEmail: string;
  desk: "hr" | "it";
  onClose: () => void;
  onSave: (row: OnboardingRequest) => Promise<void>;
  onSent: (message: string) => void;
}) {
  const { slug } = useRecruitment();
  const [draft, setDraft] = useState<OnboardingRequest | null>(row);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!item || !draft) {
    return <ModalFrame open={open} onClose={onClose} title="IT request" wide>{null}</ModalFrame>;
  }

  const currentItem = item;
  const currentDraft = draft;
  const mergedApps = mergeLaptopApps(currentDraft.laptop_apps, apps);
  const appsDone = laptopAppsComplete(currentDraft, apps);
  const alreadySent = sentToIt(currentDraft);

  async function persist(next: OnboardingRequest, extra?: Partial<OnboardingRequest>) {
    const payload = syncReadyAt({ ...next, ...extra, requested_by: next.requested_by || userEmail }, apps);
    setSaving(true);
    setError("");
    try {
      await onSave(payload);
      setDraft(payload);
      return payload;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndClose() {
    const saved = await persist(currentDraft);
    if (saved) onClose();
  }

  async function sendToIt() {
    const next: OnboardingRequest = {
      ...currentDraft,
      requested_at: currentDraft.requested_at || new Date().toISOString(),
      requested_by: userEmail,
      laptop_status:
        currentDraft.laptop_needed && currentDraft.laptop_status === "pending"
          ? "requested"
          : currentDraft.laptop_status,
      email_status: currentDraft.email_status === "pending" ? "requested" : currentDraft.email_status,
      lark_status: currentDraft.lark_status === "pending" ? "requested" : currentDraft.lark_status,
    };
    const saved = await persist(next);
    if (!saved) return;
    setSaving(true);
    let message = "Sent to the IT Requests queue.";
    try {
      const response = await fetch("/api/onboarding/notify-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: slug,
          name: currentItem.candidate.full_name,
          role: currentItem.job.title,
          workEmail: saved.work_email,
          requestKind: saved.request_kind,
          laptopNeeded: saved.laptop_needed,
          apps: saved.laptop_needed ? apps : [],
          notes: saved.notes,
          joinDate: currentItem.join_date,
        }),
      });
      const payload = (await response.json()) as { notified?: boolean; reason?: string };
      if (payload.notified) {
        message = "Sent to IT. They got an email with a link to the IT desk.";
      } else if (payload.reason === "no-recipients") {
        message =
          "Sent to the IT queue. Add an IT email in Settings or an IT user so the team is notified.";
      } else {
        message = "Sent to the IT queue. The notification email could not be sent.";
      }
    } catch {
      message = "Sent to the IT queue. The notification email could not be sent.";
    } finally {
      setSaving(false);
    }
    onSent(message);
  }

  return (
    <ModalFrame open={open} onClose={onClose} title="IT request" wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={item.candidate.full_name} />
          <div>
            <p className="font-medium">{item.candidate.full_name}</p>
            <p className="text-sm text-muted">
              {item.job.title} · Join {formatTableDate(item.join_date) || "TBC"}
            </p>
          </div>
        </div>

        <Field label={`Google Workspace (@${workspaceDomain(draft.company_slug)})`}>
          <input
            value={draft.work_email}
            placeholder={suggestedWorkEmail(item.candidate.full_name, draft.company_slug)}
            onChange={(event) => setDraft({ ...draft, work_email: event.target.value })}
            className={fieldClass}
          />
        </Field>

        <Field label="Google account password">
          <PasswordInput
            value={draft.work_password}
            readOnly={desk === "hr"}
            autoComplete="off"
            placeholder={
              desk === "it"
                ? "Temporary password for this hire"
                : "IT fills this after creating the account"
            }
            onChange={(event) => {
              if (desk === "hr") return;
              setDraft({ ...draft, work_password: event.target.value });
            }}
          />
          <p className="mt-1.5 text-xs text-muted">
            {desk === "it"
              ? "Filled after the Google account is created. HR uses it in the Onboarding Welcoming email."
              : "Shown in the Onboarding Welcoming email when you send it."}
          </p>
        </Field>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Request type</p>
          <div className="flex flex-wrap gap-1.5">
            {(["new", "replacement"] as const).map((kind: RequestKind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setDraft({ ...draft, request_kind: kind })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  draft.request_kind === kind
                    ? "bg-accent text-white"
                    : "border border-line bg-paper text-muted hover:text-ink"
                }`}
              >
                {requestKindLabel(kind)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.laptop_needed}
            onChange={(event) =>
              setDraft({
                ...draft,
                laptop_needed: event.target.checked,
                laptop_status: event.target.checked
                  ? alreadySent
                    ? "requested"
                    : "pending"
                  : "done",
              })
            }
            className="accent-[var(--accent)]"
          />
          Laptop required
        </label>

        {draft.laptop_needed ? (
          <div className="rounded-2xl border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <IconLaptop className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">
                {desk === "it" ? "Laptop apps (check each once installed)" : "Laptop apps IT will install"}
              </p>
            </div>
            <div className="space-y-2">
              {apps.map((app) =>
                desk === "it" ? (
                  <label key={app} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(mergedApps[app])}
                      onChange={(event) => {
                        const laptop_apps = { ...mergedApps, [app]: event.target.checked };
                        const complete = apps.length > 0 && apps.every((name) => laptop_apps[name]);
                        setDraft({
                          ...draft,
                          laptop_apps,
                          laptop_status: complete ? "done" : alreadySent ? "requested" : "pending",
                        });
                      }}
                      className="accent-[var(--accent)]"
                    />
                    {app}
                  </label>
                ) : (
                  <p key={app} className="text-sm text-muted">
                    {app}
                  </p>
                ),
              )}
            </div>
            {desk === "it" && !appsDone ? (
              <p className="mt-3 text-xs text-muted">
                Laptop is Done only after every app is checked.
              </p>
            ) : null}
          </div>
        ) : null}

        {desk === "it" ? (
          <div className="space-y-3 rounded-2xl border border-line p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Mark done</p>
            <DoneCheck
              label="Google Workspace email created"
              done={draft.email_status === "done"}
              onChange={(done) =>
                setDraft({
                  ...draft,
                  email_status: done ? "done" : alreadySent ? "requested" : "pending",
                })
              }
            />
            <DoneCheck
              label="Lark invitation sent"
              done={draft.lark_status === "done"}
              onChange={(done) =>
                setDraft({
                  ...draft,
                  lark_status: done ? "done" : alreadySent ? "requested" : "pending",
                })
              }
            />
          </div>
        ) : null}

        <Field label={desk === "it" ? "Notes from HR" : "Notes for IT"}>
          <textarea
            rows={3}
            value={draft.notes}
            readOnly={desk === "it"}
            onChange={(event) => {
              if (desk === "it") return;
              setDraft({ ...draft, notes: event.target.value });
            }}
            className={`${fieldClass}${desk === "it" ? " text-muted" : ""}`}
          />
        </Field>

        <Field label="Notes from IT">
          <textarea
            rows={3}
            value={draft.it_notes}
            readOnly={desk === "hr"}
            placeholder={
              desk === "it"
                ? "Serial number, asset tag, or anything HR should know…"
                : "IT will reply here."
            }
            onChange={(event) => {
              if (desk === "hr") return;
              setDraft({ ...draft, it_notes: event.target.value });
            }}
            className={`${fieldClass}${desk === "hr" ? " text-muted" : ""}`}
          />
        </Field>

        {desk === "hr" ? (
          <p className="rounded-2xl border border-line bg-paper px-3 py-2.5 text-sm text-muted">
            {requestStatusCopy(draft, apps)}
          </p>
        ) : null}

        {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAndClose()}
            className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              desk === "it"
                ? "bg-accent text-white hover:bg-accent-hover"
                : "border border-line hover:bg-paper"
            }`}
          >
            {saving ? "Saving…" : desk === "it" ? "Update request" : "Save"}
          </button>
          {desk === "hr" && !alreadySent ? (
            <button
              type="button"
              disabled={saving || !draft.work_email.trim()}
              onClick={() => void sendToIt()}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              <IconLaptop className="h-4 w-4" />
              Send to IT
            </button>
          ) : null}
        </div>
        {desk === "hr" ? (
          <p className="text-xs text-muted">
            {alreadySent
              ? "This request is already in the IT Requests queue."
              : "Send to IT notifies the IT team by email and puts this on their Requests queue."}
          </p>
        ) : (
          <p className="text-xs text-muted">
            Tick each app once it is installed, then mark Workspace and Lark Done. HR will see this hire in New joiners.
          </p>
        )}
      </div>
    </ModalFrame>
  );
}

function DoneCheck({
  label,
  done,
  onChange,
}: {
  label: string;
  done: boolean;
  onChange: (done: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={done}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
