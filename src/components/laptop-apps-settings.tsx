"use client";

import { IconClose, IconPlus } from "@/components/icons";
import { Field, fieldClass } from "@/components/ui";
import { DEFAULT_LAPTOP_APPS } from "@/lib/onboarding";
import { useOnboarding } from "@/lib/use-onboarding";
import { useRecruitment } from "@/lib/recruitment-context";
import { useState } from "react";

export function LaptopAppsSettings() {
  const { slug } = useRecruitment();
  const { settings, saveSettings } = useOnboarding(slug);
  const [apps, setApps] = useState<string[] | null>(null);
  const [itEmail, setItEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (settings && apps === null) setApps(settings.laptop_apps);
  if (settings && itEmail === null) setItEmail(settings.it_email);

  const list = apps && apps.length > 0 ? apps : [...DEFAULT_LAPTOP_APPS];

  if (!settings || apps === null || itEmail === null) return null;

  return (
    <form
      className="space-y-4 rounded-[24px] border border-line bg-paper-raised p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");
        try {
          await saveSettings({ laptop_apps: list, it_email: itEmail });
          setSuccess("Onboarding IT settings saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-medium">Onboarding · IT</h2>
        <p className="mt-1 text-sm text-muted">
          Laptop is ready only after every app below is installed. The IT team
          email is notified when HR sends a request, with a link to the IT desk.
        </p>
      </div>

      <Field label="IT team email">
        <input
          type="email"
          value={itEmail}
          onChange={(event) => setItEmail(event.target.value)}
          placeholder="it@aerisbeaute.com"
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-muted">
          Notified when HR clicks Send to IT, along with any user who has the IT
          role.
        </p>
      </Field>

      <Field label="Required laptop apps">
        <div className="space-y-2">
          {list.map((app, index) => (
            <div key={`${index}-${app}`} className="flex gap-2">
              <input
                value={app}
                onChange={(event) => {
                  const next = [...list];
                  next[index] = event.target.value;
                  setApps(next);
                }}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setApps(list.filter((_, item) => item !== index))}
                className="rounded-full p-2 text-muted hover:text-ink"
                aria-label="Remove app"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Field>

      <div className="flex flex-col items-start gap-4 pt-1">
        <button
          type="button"
          onClick={() => setApps([...list, ""])}
          className="inline-flex items-center gap-1.5 text-sm text-accent"
        >
          <IconPlus className="h-4 w-4" />
          Add app
        </button>

        {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}
        {success ? <p className="text-sm text-accent">{success}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save IT settings"}
        </button>
      </div>
    </form>
  );
}
