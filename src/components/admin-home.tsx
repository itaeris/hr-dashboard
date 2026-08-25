"use client";

import {
  deleteAppUserAction,
  logoutAction,
  saveAppUserAction,
  type RoleState,
} from "@/app/actions/auth";
import { loadBrandProgress, type BrandProgress } from "@/lib/admin-stats";
import type { AppUser } from "@/lib/auth/app-users";
import { workspaceLabel } from "@/lib/auth/access";
import type { AuthUser } from "@/lib/auth/users";
import { roleLabel } from "@/lib/auth/users";
import { COMPANY_LIST, COMPANIES, themeStyle } from "@/lib/companies";
import type { CompanySlug } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyMark } from "./company-mark";
import { Select } from "./fields";
import { IconPencil, IconTrash } from "./icons";
import { Field, PasswordInput, fieldClass } from "./ui";

export function AdminHome({
  user,
  users,
}: {
  user: AuthUser;
  users: AppUser[];
}) {
  const [stats, setStats] = useState<Record<CompanySlug, BrandProgress> | null>(null);

  useEffect(() => {
    void Promise.all([
      loadBrandProgress("aeris-beaute"),
      loadBrandProgress("from-this-island"),
    ]).then(([aeris, fti]) => {
      setStats({ "aeris-beaute": aeris, "from-this-island": fti });
    });
  }, []);

  return (
    <div className="app-frame relative min-h-dvh overflow-x-clip bg-[#F4EEE6] text-ink">
      <div className="pointer-events-none absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-[#E8D2D4]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-[#C9DDD8]/80 blur-3xl" />

      <div className="relative flex min-h-dvh w-full min-w-0 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 sm:pb-8 sm:pt-[max(2rem,env(safe-area-inset-top))]">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
              HR Recruitment · Admin
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:mt-3 sm:text-4xl lg:text-5xl">
              Progress across both brands.
            </h1>
          </div>
          <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {roleLabel(user.role)}
              </p>
            </div>
            <form action={logoutAction} className="sm:mt-3">
              <button type="submit" className="text-sm text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </motion.header>

        <div className="mt-8 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-2">
          {COMPANY_LIST.map((company, index) => {
            const progress = stats?.[company.slug];
            return (
              <motion.div
                key={company.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.08, duration: 0.45 }}
              >
                <Link
                  href={`/${company.slug}`}
                  style={themeStyle(company.theme)}
                  className="group block overflow-hidden rounded-[24px] border border-white/60 bg-paper-raised p-5 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] transition hover:-translate-y-1 sm:rounded-[28px] sm:p-7"
                >
                  <div
                    className="mb-6 h-px"
                    style={{ background: company.theme.accent }}
                  />
                  <div className="flex items-center gap-4">
                    <CompanyMark
                      slug={company.slug}
                      className={
                        company.slug === "aeris-beaute" ? "h-5 w-24" : "h-10 w-10"
                      }
                    />
                    <h2 className="min-w-0 font-display text-2xl sm:text-3xl">{company.name}</h2>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Candidates" value={progress?.candidates} />
                    <Stat label="Active" value={progress?.active} />
                    <Stat label="Open roles" value={progress?.openJobs} />
                    <Stat label="Hired / mo" value={progress?.hiredThisMonth} />
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                    Open workspace
                    <span className="transition group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <RoleSettings users={users} currentEmail={user.email} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-medium">{value ?? "—"}</p>
    </div>
  );
}

function RoleSettings({
  users,
  currentEmail,
}: {
  users: AppUser[];
  currentEmail: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<RoleState, FormData>(
    saveAppUserAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState<RoleState, FormData>(
    deleteAppUserAction,
    null,
  );
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"hr" | "admin">("hr");
  const [company, setCompany] = useState("aeris-beaute");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function resetForm() {
    setEditing(null);
    setConfirmEmail(null);
    setEmail("");
    setName("");
    setRole("hr");
    setCompany("aeris-beaute");
    setPassword("");
    setConfirmPassword("");
  }

  function startEdit(item: AppUser) {
    setConfirmEmail(null);
    setEditing(item);
    setEmail(item.email);
    setName(item.name);
    setRole(item.role);
    setCompany(item.role === "admin" ? "both" : item.company);
    setPassword("");
    setConfirmPassword("");
  }

  const successKey = state?.success || deleteState?.success || "";
  const [seenSuccess, setSeenSuccess] = useState("");
  if (successKey !== seenSuccess) {
    setSeenSuccess(successKey);
    if (successKey) resetForm();
  }

  useEffect(() => {
    if (successKey) router.refresh();
  }, [router, successKey]);

  const notice = deleteState?.error || deleteState?.success || state?.error || state?.success;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8 rounded-[24px] border border-white/60 bg-paper-raised p-5 shadow-[0_20px_50px_-28px_rgba(40,24,20,0.35)] sm:mt-10 sm:rounded-[28px] sm:p-6"
    >
      <h2 className="font-display text-2xl sm:text-3xl">User roles</h2>
      <p className="mt-1 text-sm text-muted">
        Only admin can open both brands. HR is locked to one workspace.
      </p>

      <div className="mt-5 space-y-3 md:hidden">
        {users.map((item) => (
          <div key={item.email} className="rounded-2xl border border-line px-4 py-3">
            <p className="font-medium">{item.name}</p>
            <p className="mt-0.5 break-all text-sm text-muted">{item.email}</p>
            <p className="mt-2 text-sm">
              {roleLabel(item.role)}
              <span className="text-muted"> · {workspaceLabel(item.company)}</span>
            </p>
            <UserRowActions
              item={item}
              currentEmail={currentEmail}
              confirmEmail={confirmEmail}
              deletePending={deletePending}
              deleteAction={deleteAction}
              onEdit={() => startEdit(item)}
              onAskDelete={() => setConfirmEmail(item.email)}
              onCancelDelete={() => setConfirmEmail(null)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Workspace</th>
              <th className="pb-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.email} className="border-t border-line">
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-muted">{item.email}</td>
                <td className="py-3">{roleLabel(item.role)}</td>
                <td className="py-3 text-muted">{workspaceLabel(item.company)}</td>
                <td className="py-3 text-right">
                  <UserRowActions
                    item={item}
                    currentEmail={currentEmail}
                    confirmEmail={confirmEmail}
                    deletePending={deletePending}
                    deleteAction={deleteAction}
                    onEdit={() => startEdit(item)}
                    onAskDelete={() => setConfirmEmail(item.email)}
                    onCancelDelete={() => setConfirmEmail(null)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={action} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            value={email}
            readOnly={Boolean(editing)}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@aerisbeaute.com"
            className={`${fieldClass} ${editing ? "bg-paper-raised text-muted" : ""}`}
          />
        </Field>
        <Field label="Name">
          <input
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className={fieldClass}
          />
        </Field>
        <Field label="Role">
          <Select
            name="role"
            value={role}
            onChange={(value) => {
              const next = value === "admin" ? "admin" : "hr";
              setRole(next);
              setCompany(next === "admin" ? "both" : company === "both" ? "aeris-beaute" : company);
            }}
            options={[
              { value: "hr", label: "HR" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </Field>
        <Field label="Workspace">
          <Select
            name="company"
            value={company}
            onChange={setCompany}
            options={[
              { value: "aeris-beaute", label: COMPANIES["aeris-beaute"].name },
              { value: "from-this-island", label: COMPANIES["from-this-island"].name },
              { value: "both", label: "Both brands" },
            ]}
          />
        </Field>
        <Field label={editing ? "New password" : "Password"}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            minLength={editing ? undefined : 8}
            required={!editing}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={editing ? "Leave blank to keep current" : "At least 8 characters"}
          />
        </Field>
        <Field label="Confirm password">
          <PasswordInput
            name="confirm_password"
            autoComplete="new-password"
            minLength={editing ? undefined : 8}
            required={!editing || Boolean(password)}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={editing ? "Leave blank to keep current" : "Repeat password"}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          {notice ? (
            <p className={`text-sm ${notice.includes("Saved") || notice.includes("Deleted") ? "text-accent" : "text-[#E24B4A]"}`}>
              {notice}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#1C1412] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : editing ? "Update user" : "Save user role"}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:bg-paper"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </motion.section>
  );
}

function UserRowActions({
  item,
  currentEmail,
  confirmEmail,
  deletePending,
  deleteAction,
  onEdit,
  onAskDelete,
  onCancelDelete,
}: {
  item: AppUser;
  currentEmail: string;
  confirmEmail: string | null;
  deletePending: boolean;
  deleteAction: (payload: FormData) => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
}) {
  const self = item.email === currentEmail;

  if (confirmEmail === item.email) {
    return (
      <form action={deleteAction} className="mt-3 flex flex-wrap items-center justify-end gap-2 md:mt-0">
        <input type="hidden" name="email" value={item.email} />
        <span className="text-xs text-muted">Delete {item.name}?</span>
        <button
          type="submit"
          disabled={deletePending}
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper-raised disabled:opacity-50"
        >
          {deletePending ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          className="rounded-full border border-line px-3 py-1.5 text-xs text-ink"
        >
          Keep
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex justify-end gap-2 md:mt-0">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper"
      >
        <IconPencil className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        type="button"
        disabled={self}
        onClick={onAskDelete}
        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconTrash className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}
