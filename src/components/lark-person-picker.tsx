"use client";

import { larkUserLabel, type LarkUser } from "@/lib/lark/users";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconClose, IconPlus, IconSearch } from "./icons";

const inputClass =
  "w-full rounded-xl border bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/80";

let usersCache: LarkUser[] | null = null;
let usersError = "";
let usersInflight: Promise<LarkUser[]> | null = null;

const STORAGE_KEY = "hr-lark-users";
const STORAGE_MS = 15 * 60 * 1000;

function readStoredUsers() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { users?: LarkUser[]; at?: number };
    if (!Array.isArray(parsed.users) || parsed.users.length === 0) return null;
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > STORAGE_MS) return null;
    return parsed.users;
  } catch {
    return null;
  }
}

function writeStoredUsers(users: LarkUser[]) {
  usersCache = users;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ users, at: Date.now() }));
  } catch {
    /* quota */
  }
}

export async function loadLarkUsers() {
  if (usersCache && usersCache.length > 0) return usersCache;
  const stored = readStoredUsers();
  if (stored) {
    usersCache = stored;
    return stored;
  }
  if (usersInflight) return usersInflight;

  usersInflight = fetch("/api/lark/users")
    .then(async (response) => {
      const payload = (await response.json()) as { users?: LarkUser[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not load Lark users.");
      }
      const users = payload.users ?? [];
      writeStoredUsers(users);
      usersError = "";
      return users;
    })
    .catch((cause) => {
      usersError = cause instanceof Error ? cause.message : "Could not load Lark users.";
      throw cause;
    })
    .finally(() => {
      usersInflight = null;
    });

  return usersInflight;
}

export function LarkPersonPicker({
  value,
  onChange,
  onSelectUser,
  invalid,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectUser?: (user: LarkUser | null) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const menuId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<LarkUser[]>(usersCache ?? []);
  const [loading, setLoading] = useState(!usersCache);
  const [error, setError] = useState(usersError);
  const selected = Boolean(value);

  useEffect(() => {
    let cancelled = false;
    void loadLarkUsers()
      .then((next) => {
        if (!cancelled) {
          setUsers(next);
          setError("");
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load Lark users.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? users.filter(
          (user) =>
            user.name.toLowerCase().includes(needle) ||
            user.email.toLowerCase().includes(needle) ||
            user.department.toLowerCase().includes(needle),
        )
      : users;
    return list.slice(0, 40);
  }, [query, users]);

  function pick(user: LarkUser) {
    onChange(larkUserLabel(user));
    onSelectUser?.(user);
    setQuery("");
    setOpen(false);
  }

  function confirmTyped() {
    const exact = matches.find(
      (user) =>
        user.name.toLowerCase() === query.trim().toLowerCase() ||
        larkUserLabel(user).toLowerCase() === query.trim().toLowerCase(),
    );
    if (exact) {
      pick(exact);
      return;
    }
    if (matches.length === 1) pick(matches[0]);
  }

  if (selected) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border bg-paper-raised px-3 py-2 ${
          invalid ? "border-[#E57373]" : "border-line"
        }`}
      >
        <span className="truncate text-sm">{value}</span>
        <button
          type="button"
          onClick={() => {
            onChange("");
            onSelectUser?.(null);
            setQuery("");
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="rounded-full p-1 text-muted hover:text-ink"
          aria-label="Remove person"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmTyped();
                }
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder || "Search Lark users"}
              autoComplete="off"
              className={`${inputClass} pl-9 ${invalid ? "border-[#E57373]" : "border-line focus:border-accent"}`}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (query.trim()) confirmTyped();
              else {
                setOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
            aria-label="Add person"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </div>
        {open ? (
          <div
            id={menuId}
            className="absolute z-30 mt-1 max-h-64 w-[calc(100%-2.75rem)] overflow-auto rounded-2xl border border-line bg-paper-raised py-1 shadow-lg"
          >
            {loading ? (
              <p className="px-3 py-2 text-sm text-muted">Loading Lark users…</p>
            ) : error ? (
              <p className="px-3 py-2 text-sm text-[#E24B4A]">{error}</p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">
                {users.length === 0 ? "No Lark users available." : "No matching Lark user."}
              </p>
            ) : (
              matches.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(user)}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-paper"
                >
                  <span className="text-sm text-ink">{user.name}</span>
                  {user.email || user.department ? (
                    <span className="truncate text-xs text-muted">
                      {user.email || user.department}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[#E24B4A]">{error}</p> : null}
    </div>
  );
}
