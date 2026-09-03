"use client";

import type { ApprovalMember } from "@/lib/recruitment-approval-flow";
import type { LarkUser } from "@/lib/lark/users";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconClose, IconSearch } from "./icons";
import { loadLarkUsers } from "./lark-person-picker";

const inputClass =
  "w-full rounded-xl border bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/80";

export function LarkPeoplePicker({
  value,
  onChange,
  placeholder,
}: {
  value: ApprovalMember[];
  onChange: (next: ApprovalMember[]) => void;
  placeholder?: string;
}) {
  const menuId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<LarkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const selectedIds = new Set(value.map((item) => item.id).filter(Boolean));
    const selectedNames = new Set(value.map((item) => item.name.toLowerCase()));
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => {
        if (selectedIds.has(user.id) || selectedNames.has(user.name.toLowerCase())) {
          return false;
        }
        if (!needle) return true;
        return (
          user.name.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle) ||
          user.department.toLowerCase().includes(needle)
        );
      })
      .slice(0, 40);
  }, [query, users, value]);

  function add(user: LarkUser) {
    onChange([...value, { name: user.name, id: user.id }]);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((member, index) => (
            <span
              key={`${member.id || member.name}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs"
            >
              <span className="truncate">{member.name}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                className="rounded-full p-0.5 text-muted hover:text-ink"
                aria-label={`Remove ${member.name}`}
              >
                <IconClose className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
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
              if (matches[0]) add(matches[0]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder || "Search Lark users to add"}
          autoComplete="off"
          className={`${inputClass} pl-9 border-line focus:border-accent`}
        />
        {open ? (
          <div
            id={menuId}
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-paper-raised py-1 shadow-lg"
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
                  onClick={() => add(user)}
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
