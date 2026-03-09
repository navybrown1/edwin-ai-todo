"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadLocalPlannerSettings, saveLocalPlannerSettings } from "@/lib/local-store";
import type { PlannerSettings } from "@/types";

interface PlannerCapabilities {
  emailReady: boolean;
  googleReady: boolean;
  pushPublicKey: string;
  pushReady: boolean;
}

interface PlannerControlPanelProps {
  spaceKey: string;
}

const LEAD_TIME_OPTIONS = [
  { label: "10 min", value: 10 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "2 hr", value: 120 },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.5C5.79 2.5 4 4.29 4 6.5V8.46C4 9.07 3.78 9.66 3.38 10.12L2.75 10.83C2.3 11.35 2.67 12.17 3.36 12.17H12.64C13.33 12.17 13.7 11.35 13.25 10.83L12.62 10.12C12.22 9.66 12 9.07 12 8.46V6.5C12 4.29 10.21 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.4 13.17C6.72 13.75 7.32 14.13 8 14.13C8.68 14.13 9.28 13.75 9.6 13.17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12.75 6.25V3.25H9.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.25 9.75V12.75H6.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.18 7A4.75 4.75 0 0 0 4.43 4.87L3.25 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.82 9A4.75 4.75 0 0 0 11.57 11.13L12.75 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M16.2 9.2C16.2 8.53 16.14 7.9 16.01 7.3H9V10.17H13.02C12.85 11.09 12.32 11.87 11.53 12.39V14.26H13.95C15.37 12.96 16.2 11.04 16.2 9.2Z" fill="#4285F4" />
      <path d="M9 16.5C11.01 16.5 12.69 15.84 13.95 14.26L11.53 12.39C10.86 12.84 10 13.11 9 13.11C7.06 13.11 5.41 11.8 4.82 10.03H2.33V11.95C3.58 14.44 6.15 16.5 9 16.5Z" fill="#34A853" />
      <path d="M4.82 10.03C4.67 9.58 4.58 9.1 4.58 8.6C4.58 8.1 4.67 7.62 4.82 7.17V5.25H2.33C1.81 6.28 1.5 7.41 1.5 8.6C1.5 9.79 1.81 10.92 2.33 11.95L4.82 10.03Z" fill="#FBBC05" />
      <path d="M9 4.09C10.09 4.09 11.07 4.46 11.84 5.18L14.01 3.01C12.68 1.77 11 1 9 1C6.15 1 3.58 3.06 2.33 5.25L4.82 7.17C5.41 5.4 7.06 4.09 9 4.09Z" fill="#EA4335" />
    </svg>
  );
}

export default function PlannerControlPanel({ spaceKey }: PlannerControlPanelProps) {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<PlannerSettings | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(30);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const capabilities = useMemo<PlannerCapabilities>(
    () => ({
      emailReady: false,
      googleReady: false,
      pushPublicKey: "",
      pushReady: false,
    }),
    [],
  );

  const load = async () => {
    const data = loadLocalPlannerSettings(spaceKey);
    setSettings(data);
    setEmailAddress(data.emailAddress || "");
    setReminderLeadMinutes(data.reminderLeadMinutes || 30);
    setEmailEnabled(Boolean(data.emailEnabled));
    setPushEnabled(Boolean(data.pushEnabled));
  };

  useEffect(() => {
    void load().catch((error) => {
      console.error("Failed to load planner control panel:", error);
      setStatus("Could not load planner controls.");
    });
  }, [spaceKey]);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return;

    const next = saveLocalPlannerSettings(spaceKey, { timezone });
    setSettings((current) => current ?? next);
  }, [spaceKey]);

  const googleStatus = useMemo(() => {
    if (!settings) return "Loading...";
    return "Google Calendar sync is scaffolded, but cloud planner services are offline in this environment right now.";
  }, [settings]);

  const saveSettings = async () => {
    setBusy("save");
    setStatus(null);

    const next = saveLocalPlannerSettings(spaceKey, {
      emailAddress,
      emailEnabled,
      pushEnabled,
      reminderLeadMinutes,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    setSettings(next);
    setStatus("Planner preferences saved locally on this device.");
    setBusy(null);
  };

  const connectGoogle = async () => {
    setStatus("Google Calendar sync needs a healthy backend plus OAuth env vars before it can connect.");
  };

  const syncGoogle = async () => {
    setStatus("Google sync is not available while the app is running in local mode.");
  };

  const disconnectGoogle = async () => {
    setStatus("Google sync is not active in local mode.");
  };

  const enablePush = async () => {
    setStatus("Device push alerts need cloud delivery plus VAPID keys before they can be enabled.");
  };

  const disablePush = async () => {
    const next = saveLocalPlannerSettings(spaceKey, { pushEnabled: false });
    setSettings(next);
    setPushEnabled(false);
    setStatus("Device alerts are stored as off in local mode.");
  };

  const sendTest = async () => {
    setStatus("Test reminders need cloud delivery configured before they can send.");
  };

  useEffect(() => {
    const plannerState = searchParams.get("planner");
    if (!plannerState || typeof window === "undefined") return;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("planner");
    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.replaceState({}, "", nextPath);

    if (plannerState === "google-connected") {
      setStatus("Google returned from OAuth, but the cloud planner backend is offline so the account was not attached.");
      return;
    }

    if (plannerState === "google-error") {
      setStatus("Google Calendar connection did not complete. Try again.");
    }
  }, [searchParams, syncGoogle]);

  return (
    <section className="glass rounded-[28px] p-5 animate-fadeUp">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-muted">Sync & Alerts</p>
          <p className="mt-2 font-syne text-[1.35rem] leading-none text-textPrimary">Planner Ops</p>
        </div>
        <div className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
          {busy ? "Working" : "Ready"}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="glass-subtle rounded-[22px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
                <GoogleIcon />
                Google Calendar
              </div>
              <p className="mt-2 text-sm font-dm leading-relaxed text-textPrimary/88">{googleStatus}</p>
            </div>
            <div className="rounded-full border border-border bg-surface2/75 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.12em] text-muted">
              Local Mode
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {settings?.googleConnected ? (
              <>
                <button
                  onClick={syncGoogle}
                  disabled={busy === "sync"}
                  className="primary-action inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-xs font-syne font-bold disabled:opacity-50"
                >
                  <SyncIcon />
                  Sync Now
                </button>
                <button
                  onClick={disconnectGoogle}
                  disabled={busy === "disconnect"}
                  className="secondary-action rounded-[14px] px-3.5 py-2 text-xs font-dm text-textPrimary disabled:opacity-50"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectGoogle}
                className="primary-action inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-xs font-syne font-bold"
              >
                <GoogleIcon />
                Connect Google
              </button>
            )}
          </div>
        </div>

        <div className="glass-subtle rounded-[22px] p-4">
          <div className="flex items-center gap-2 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
            <BellIcon />
            Reminder Channels
          </div>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[11px] font-dm uppercase tracking-[0.12em] text-muted">Email alerts</span>
            <input
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-[16px] border border-border bg-surface/70 px-3.5 py-2.5 text-sm text-textPrimary outline-none placeholder:text-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
            />
          </label>

          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_148px]">
            <label className="secondary-action flex items-center justify-between rounded-[16px] px-3.5 py-2.5">
              <span className="text-sm font-dm text-textPrimary">Email reminder enabled</span>
              <input
                checked={emailEnabled}
                onChange={(event) => setEmailEnabled(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 accent-[rgb(var(--accent-rgb))]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-dm uppercase tracking-[0.12em] text-muted">Lead time</span>
              <select
                value={reminderLeadMinutes}
                onChange={(event) => setReminderLeadMinutes(Number(event.target.value))}
                className="w-full rounded-[16px] border border-border bg-surface/70 px-3.5 py-2.5 text-sm text-textPrimary outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
              >
                {LEAD_TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {pushEnabled ? (
              <button
                onClick={disablePush}
                className="secondary-action rounded-[14px] px-3.5 py-2 text-xs font-dm text-textPrimary disabled:opacity-50"
              >
                Disable Device Alerts
              </button>
            ) : (
              <button
                onClick={enablePush}
                className="secondary-action rounded-[14px] px-3.5 py-2 text-xs font-dm text-textPrimary"
              >
                Enable Device Alerts
              </button>
            )}

            <button
              onClick={saveSettings}
              disabled={busy === "save"}
              className="primary-action rounded-[14px] px-3.5 py-2 text-xs font-syne font-bold disabled:opacity-50"
            >
              Save Alerts
            </button>

            <button
              onClick={sendTest}
              className="secondary-action rounded-[14px] px-3.5 py-2 text-xs font-dm text-textPrimary"
            >
              Send Test
            </button>
          </div>

          <p className="mt-3 text-[11px] font-dm leading-relaxed text-muted/78">
            Manual planning preferences save locally on this device right now. Cloud delivery for Google sync, push, and email remains scaffolded but unavailable until the backend quota and environment keys are restored.
          </p>
          <p className="mt-2 text-[11px] font-dm leading-relaxed text-muted/62">
            Email delivery stays unavailable until `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, Google OAuth, and push keys are present alongside a healthy backend connection.
          </p>
        </div>

        {status ? <p className="text-[12px] font-dm leading-relaxed text-accent/88">{status}</p> : null}
      </div>
    </section>
  );
}
