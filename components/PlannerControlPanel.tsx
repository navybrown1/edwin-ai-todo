"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJson, withSpaceKey } from "@/lib/client-utils";
import { loadLocalPlannerSettings, localPlannerSettingsHaveChanges, saveLocalPlannerSettings } from "@/lib/local-store";
import type { PlannerSettings } from "@/types";

interface PlannerCapabilities {
  emailReady: boolean;
  googleReady: boolean;
  pushPublicKey: string;
  pushReady: boolean;
}

interface PlannerSettingsPayload extends PlannerSettings {
  capabilities: PlannerCapabilities;
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

const EMPTY_CAPABILITIES: PlannerCapabilities = {
  emailReady: false,
  googleReady: false,
  pushPublicKey: "",
  pushReady: false,
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function toPlannerSettings(payload: PlannerSettingsPayload | PlannerSettings): PlannerSettings {
  return {
    emailAddress: payload.emailAddress,
    emailEnabled: payload.emailEnabled,
    googleCalendarId: payload.googleCalendarId,
    googleCalendarLabel: payload.googleCalendarLabel,
    googleConnected: payload.googleConnected,
    googleEmail: payload.googleEmail,
    lastGoogleSyncAt: payload.lastGoogleSyncAt ?? null,
    pushEnabled: payload.pushEnabled,
    reminderLeadMinutes: payload.reminderLeadMinutes,
    spaceKey: payload.spaceKey,
    timezone: payload.timezone,
  };
}

function persistLocalSettings(spaceKey: string, settings: PlannerSettings) {
  return saveLocalPlannerSettings(spaceKey, {
    emailAddress: settings.emailAddress,
    emailEnabled: settings.emailEnabled,
    googleCalendarId: settings.googleCalendarId,
    googleCalendarLabel: settings.googleCalendarLabel,
    googleConnected: settings.googleConnected,
    googleEmail: settings.googleEmail,
    lastGoogleSyncAt: settings.lastGoogleSyncAt ?? null,
    pushEnabled: settings.pushEnabled,
    reminderLeadMinutes: settings.reminderLeadMinutes,
    timezone: settings.timezone,
  });
}

function remotePlannerSettingsNeedMigration(settings: PlannerSettings) {
  return Boolean(
    settings.emailAddress.trim() ||
      settings.emailEnabled ||
      settings.pushEnabled ||
      settings.reminderLeadMinutes !== 30 ||
      settings.googleConnected ||
      settings.googleEmail.trim() ||
      settings.googleCalendarId !== "primary" ||
      settings.googleCalendarLabel !== "Primary calendar",
  );
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
  const [syncMode, setSyncMode] = useState<"cloud" | "local">("cloud");
  const [capabilities, setCapabilities] = useState<PlannerCapabilities>(EMPTY_CAPABILITIES);

  const applySettings = useCallback((nextSettings: PlannerSettings) => {
    setSettings(nextSettings);
    setEmailAddress(nextSettings.emailAddress || "");
    setReminderLeadMinutes(nextSettings.reminderLeadMinutes || 30);
    setEmailEnabled(Boolean(nextSettings.emailEnabled));
    setPushEnabled(Boolean(nextSettings.pushEnabled));
  }, []);

  const load = useCallback(
    async (options?: { preserveStatus?: boolean }) => {
      const localSettings = loadLocalPlannerSettings(spaceKey);

      try {
        let remotePayload = await fetchJson<PlannerSettingsPayload>(withSpaceKey("/api/planner/settings", spaceKey), {
          cache: "no-store",
        });

        if (localPlannerSettingsHaveChanges(spaceKey) && !remotePlannerSettingsNeedMigration(toPlannerSettings(remotePayload))) {
          remotePayload = await fetchJson<PlannerSettingsPayload>("/api/planner/settings", {
            body: JSON.stringify({
              emailAddress: localSettings.emailAddress,
              emailEnabled: localSettings.emailEnabled,
              googleCalendarId: localSettings.googleCalendarId,
              googleCalendarLabel: localSettings.googleCalendarLabel,
              pushEnabled: localSettings.pushEnabled,
              reminderLeadMinutes: localSettings.reminderLeadMinutes,
              spaceKey,
              timezone: localSettings.timezone,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "PATCH",
          });

          if (!options?.preserveStatus) {
            setStatus("Recovered your planner settings into cloud sync.");
          }
        } else if (!options?.preserveStatus) {
          setStatus(null);
        }

        const nextSettings = persistLocalSettings(spaceKey, toPlannerSettings(remotePayload));
        applySettings(nextSettings);
        setCapabilities(remotePayload.capabilities ?? EMPTY_CAPABILITIES);
        setSyncMode("cloud");
      } catch (error) {
        console.error("Falling back to local planner settings:", error);
        const nextSettings = persistLocalSettings(spaceKey, localSettings);
        applySettings(nextSettings);
        setCapabilities(EMPTY_CAPABILITIES);
        setSyncMode("local");
        if (!options?.preserveStatus) {
          setStatus("Planner controls are saving locally on this device.");
        }
      }
    },
    [applySettings, spaceKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || settings?.timezone === timezone) return;

    persistLocalSettings(spaceKey, {
      ...(settings ?? loadLocalPlannerSettings(spaceKey)),
      timezone,
    });
  }, [settings, spaceKey]);

  const googleStatus = useMemo(() => {
    if (!settings) return "Loading...";
    if (settings.googleConnected) {
      const identity = settings.googleEmail ? `as ${settings.googleEmail}` : "to this space";
      return `Connected ${identity}. Sync will pull from ${settings.googleCalendarLabel}.`;
    }
    if (capabilities.googleReady) {
      return "Bring your Google Calendar into this planner and pull your schedule onto the board.";
    }
    return "Google Calendar sync is wired in code, but this environment still needs Google OAuth keys.";
  }, [capabilities.googleReady, settings]);

  const saveSettings = useCallback(async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fallbackSettings = persistLocalSettings(spaceKey, {
      ...(settings ?? loadLocalPlannerSettings(spaceKey)),
      emailAddress,
      emailEnabled,
      pushEnabled,
      reminderLeadMinutes,
      timezone,
    });

    setBusy("save");
    setStatus(null);

    try {
      const payload = await fetchJson<PlannerSettingsPayload>("/api/planner/settings", {
        body: JSON.stringify({
          emailAddress,
          emailEnabled,
          pushEnabled,
          reminderLeadMinutes,
          spaceKey,
          timezone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const nextSettings = persistLocalSettings(spaceKey, toPlannerSettings(payload));
      applySettings(nextSettings);
      setCapabilities(payload.capabilities ?? EMPTY_CAPABILITIES);
      setSyncMode("cloud");
      setStatus("Planner preferences saved.");
    } catch (error) {
      console.error("Saving planner settings locally because cloud sync failed:", error);
      applySettings(fallbackSettings);
      setSyncMode("local");
      setStatus("Planner preferences were saved locally on this device.");
    } finally {
      setBusy(null);
    }
  }, [applySettings, emailAddress, emailEnabled, pushEnabled, reminderLeadMinutes, settings, spaceKey]);

  const connectGoogle = useCallback(async () => {
    if (!capabilities.googleReady) {
      setStatus("Google Calendar needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.");
      return;
    }

    setBusy("connect");
    try {
      const data = await fetchJson<{ authUrl: string }>(withSpaceKey("/api/planner/google/start", spaceKey), {
        cache: "no-store",
      });
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("Failed to start Google Calendar auth:", error);
      setStatus(error instanceof Error ? error.message : "Could not start Google Calendar connection.");
      setBusy(null);
    }
  }, [capabilities.googleReady, spaceKey]);

  const syncGoogle = useCallback(async () => {
    setBusy("sync");
    try {
      const result = await fetchJson<{ importedCount: number; ok: boolean }>("/api/planner/google/sync", {
        body: JSON.stringify({ spaceKey }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      await load({ preserveStatus: true });
      window.dispatchEvent(new Event("planner-events-refresh"));
      setSyncMode("cloud");
      setStatus(`Imported ${result.importedCount} Google Calendar event${result.importedCount === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error("Google Calendar sync failed:", error);
      setStatus(error instanceof Error ? error.message : "Google Calendar sync failed.");
    } finally {
      setBusy(null);
    }
  }, [load, spaceKey]);

  const disconnectGoogle = useCallback(async () => {
    setBusy("disconnect");
    try {
      await fetchJson<{ ok: boolean }>("/api/planner/google/disconnect", {
        body: JSON.stringify({ spaceKey }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      await load({ preserveStatus: true });
      window.dispatchEvent(new Event("planner-events-refresh"));
      setSyncMode("cloud");
      setStatus("Google Calendar disconnected.");
    } catch (error) {
      console.error("Failed to disconnect Google Calendar:", error);
      setStatus(error instanceof Error ? error.message : "Could not disconnect Google Calendar.");
    } finally {
      setBusy(null);
    }
  }, [load, spaceKey]);

  const enablePush = useCallback(async () => {
    if (!capabilities.pushReady || !capabilities.pushPublicKey) {
      setStatus("Push alerts need NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("This browser does not support push notifications.");
      return;
    }

    setBusy("push");

    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notifications permission was not granted.");
      }

      const registration = await navigator.serviceWorker.register("/reminder-sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(capabilities.pushPublicKey),
          userVisibleOnly: true,
        }));

      await fetchJson<{ ok: boolean }>("/api/planner/push", {
        body: JSON.stringify({ spaceKey, subscription }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = await fetchJson<PlannerSettingsPayload>("/api/planner/settings", {
        body: JSON.stringify({
          pushEnabled: true,
          spaceKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const nextSettings = persistLocalSettings(spaceKey, toPlannerSettings(payload));
      applySettings(nextSettings);
      setCapabilities(payload.capabilities ?? EMPTY_CAPABILITIES);
      setSyncMode("cloud");
      setStatus("Device alerts enabled.");
    } catch (error) {
      console.error("Failed to enable push alerts:", error);
      setStatus(error instanceof Error ? error.message : "Could not enable device alerts.");
    } finally {
      setBusy(null);
    }
  }, [applySettings, capabilities.pushPublicKey, capabilities.pushReady, spaceKey]);

  const disablePush = useCallback(async () => {
    setBusy("push");

    try {
      if ("serviceWorker" in navigator) {
        const registration =
          (await navigator.serviceWorker.getRegistration("/reminder-sw.js")) ?? (await navigator.serviceWorker.getRegistration());
        const subscription = await registration?.pushManager.getSubscription();

        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe().catch(() => undefined);
          await fetchJson<{ ok: boolean }>(
            `${withSpaceKey("/api/planner/push", spaceKey)}&endpoint=${encodeURIComponent(endpoint)}`,
            {
              method: "DELETE",
            },
          );
        }
      }

      const payload = await fetchJson<PlannerSettingsPayload>("/api/planner/settings", {
        body: JSON.stringify({
          pushEnabled: false,
          spaceKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const nextSettings = persistLocalSettings(spaceKey, toPlannerSettings(payload));
      applySettings(nextSettings);
      setCapabilities(payload.capabilities ?? EMPTY_CAPABILITIES);
      setSyncMode("cloud");
      setStatus("Device alerts disabled.");
    } catch (error) {
      console.error("Disabling push locally because cloud sync failed:", error);
      const nextSettings = persistLocalSettings(spaceKey, {
        ...(settings ?? loadLocalPlannerSettings(spaceKey)),
        pushEnabled: false,
      });
      applySettings(nextSettings);
      setSyncMode("local");
      setStatus("Device alerts were disabled locally on this device.");
    } finally {
      setBusy(null);
    }
  }, [applySettings, settings, spaceKey]);

  const sendTest = useCallback(async () => {
    setBusy("test");
    try {
      const result = await fetchJson<{ delivered: string[] }>("/api/planner/reminders/test", {
        body: JSON.stringify({ spaceKey }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      setStatus(`Test reminder sent via ${result.delivered.join(" and ")}.`);
    } catch (error) {
      console.error("Failed to send reminder test:", error);
      setStatus(error instanceof Error ? error.message : "Could not send a test reminder.");
    } finally {
      setBusy(null);
    }
  }, [spaceKey]);

  useEffect(() => {
    const plannerState = searchParams.get("planner");
    if (!plannerState || typeof window === "undefined") return;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("planner");
    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.replaceState({}, "", nextPath);

    if (plannerState === "google-connected") {
      setStatus("Google Calendar connected. Syncing your schedule...");
      void syncGoogle();
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
          {busy ? "Working" : syncMode === "cloud" ? "Cloud sync" : "Local backup"}
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
              {settings?.googleConnected ? "Connected" : capabilities.googleReady ? "Ready" : "Needs Keys"}
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
                disabled={busy === "connect"}
                className="primary-action inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-xs font-syne font-bold disabled:opacity-50"
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
              disabled={busy === "test"}
              className="secondary-action rounded-[14px] px-3.5 py-2 text-xs font-dm text-textPrimary disabled:opacity-50"
            >
              Send Test
            </button>
          </div>

          <p className="mt-3 text-[11px] font-dm leading-relaxed text-muted/78">
            {syncMode === "cloud"
              ? "Planner preferences are syncing to the live workspace."
              : "Planner preferences are currently saving locally on this device until cloud sync returns."}
          </p>
          <p className="mt-2 text-[11px] font-dm leading-relaxed text-muted/62">
            Missing providers keep their own features disabled. Google needs OAuth keys, email needs Resend keys, and push needs VAPID keys.
          </p>
        </div>

        {status ? <p className="text-[12px] font-dm leading-relaxed text-accent/88">{status}</p> : null}
      </div>
    </section>
  );
}
