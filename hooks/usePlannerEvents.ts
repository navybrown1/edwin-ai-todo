"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, withSpaceKey } from "@/lib/client-utils";
import { loadLocalPlannerEvents, saveLocalPlannerEvents } from "@/lib/local-store";
import { sortPlannerEvents } from "@/lib/planner-calendar";
import type { PlannerEvent } from "@/types";

type PlannerSyncMode = "cloud" | "local";

async function migrateLocalEvents(spaceKey: string, events: PlannerEvent[]) {
  await fetchJson<PlannerEvent[]>("/api/planner/events", {
    body: JSON.stringify({
      events: events.map((event) => ({
        calendarId: event.calendarId ?? null,
        color: event.color,
        date: event.date,
        externalId: event.externalId ?? null,
        scheduledAt: event.scheduledAt ?? null,
        source: event.source,
        text: event.text,
        time: event.time,
      })),
      spaceKey,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return fetchJson<PlannerEvent[]>(withSpaceKey("/api/planner/events", spaceKey), {
    cache: "no-store",
  });
}

export function usePlannerEvents(spaceKey: string) {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<PlannerSyncMode>("cloud");

  const persistEvents = useCallback(
    (nextEvents: PlannerEvent[]) => {
      const sortedEvents = [...nextEvents].sort(sortPlannerEvents);
      saveLocalPlannerEvents(spaceKey, sortedEvents);
      setEvents(sortedEvents);
      return sortedEvents;
    },
    [spaceKey],
  );

  const refresh = useCallback(
    async (options?: { preserveStatus?: boolean }) => {
      if (!spaceKey) return;

      const localEvents = loadLocalPlannerEvents(spaceKey).sort(sortPlannerEvents);

      try {
        let remoteEvents = await fetchJson<PlannerEvent[]>(withSpaceKey("/api/planner/events", spaceKey), {
          cache: "no-store",
        });

        if (remoteEvents.length === 0 && localEvents.length > 0) {
          remoteEvents = await migrateLocalEvents(spaceKey, localEvents);
          if (!options?.preserveStatus) {
            setStatusMessage("Recovered your saved plans into cloud sync.");
          }
        } else if (!options?.preserveStatus) {
          setStatusMessage(null);
        }

        setSyncMode("cloud");
        persistEvents(remoteEvents);
      } catch (error) {
        console.error("Falling back to local planner events:", error);
        setSyncMode("local");
        if (!options?.preserveStatus) {
          setStatusMessage("Planner sync is offline. Events are saving on this device.");
        }
        persistEvents(localEvents);
      }
    },
    [persistEvents, spaceKey],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh({ preserveStatus: true });
    };

    window.addEventListener("planner-events-refresh", handleRefresh);
    return () => window.removeEventListener("planner-events-refresh", handleRefresh);
  }, [refresh]);

  return {
    events,
    persistEvents,
    refresh,
    setStatusMessage,
    setSyncMode,
    statusMessage,
    syncMode,
  };
}
