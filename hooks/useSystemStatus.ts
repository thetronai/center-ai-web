"use client";

import { useCallback, useEffect, useState } from "react";
import type { SystemStatusResponse } from "@/lib/system-status/types";

export type MonitoringState =
  | { kind: "loading" }
  | { kind: "success"; data: SystemStatusResponse }
  | { kind: "empty" }
  | { kind: "error"; message: string; retryAfterSeconds: number | null }
  | { kind: "offline" };

/**
 * `live` hits the real endpoint. The rest force each required non-happy-path
 * state on demand, for demoing/testing without waiting on the upstream API
 * to actually change. See README "How to force each state".
 */
export type Scenario = "live" | "loading" | "empty" | "error" | "rate-limit" | "offline";

type FetchOutcome =
  | { kind: "success"; data: SystemStatusResponse }
  | { kind: "empty" }
  | { kind: "error"; message: string; retryAfterSeconds: number | null };

interface FetchResult {
  requestKey: string;
  outcome: FetchOutcome;
}

interface UseSystemStatusResult {
  state: MonitoringState;
  retry: () => void;
  /** Set the moment we last got a real (non-forced-loading) response from the server. */
  lastFetchedAt: Date | null;
}

export function useSystemStatus(scenario: Scenario): UseSystemStatusResult {
  const [browserOnline, setBrowserOnline] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setBrowserOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Derived, not stored — offline is a pure function of scenario + browser
  // connectivity, so it doesn't need an effect/setState of its own.
  const isOffline = scenario === "offline" || !browserOnline;
  const requestKey = `${scenario}:${reloadKey}`;

  useEffect(() => {
    // Nothing to fetch while showing the (derived) offline state, or while
    // intentionally parked on "loading" for the demo scenario.
    if (isOffline || scenario === "loading") {
      return;
    }

    let ignore = false;
    const query =
      scenario === "empty" || scenario === "error" || scenario === "rate-limit"
        ? `?force=${scenario}`
        : "";

    fetch(`/api/system-status${query}`, { cache: "no-store" })
      .then(async (res) => {
        if (ignore) return;

        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          setResult({
            requestKey,
            outcome: {
              kind: "error",
              message: "Rate limited. Please wait before retrying.",
              retryAfterSeconds: retryAfter ? Number(retryAfter) : null,
            },
          });
          return;
        }

        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null);
          const message =
            body && typeof body === "object" && "error" in body && typeof body.error === "string"
              ? body.error
              : `Request failed (${res.status})`;
          setResult({ requestKey, outcome: { kind: "error", message, retryAfterSeconds: null } });
          return;
        }

        const data = (await res.json()) as SystemStatusResponse;
        setResult({
          requestKey,
          outcome: data.length === 0 ? { kind: "empty" } : { kind: "success", data },
        });
        setLastFetchedAt(new Date());
      })
      .catch(() => {
        // Fetch rejected while the browser reports itself online — a real
        // request failure, not connectivity loss, so surface it as an error.
        if (!ignore) {
          setResult({
            requestKey,
            outcome: {
              kind: "error",
              message: "Network request failed.",
              retryAfterSeconds: null,
            },
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [scenario, isOffline, requestKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const state: MonitoringState = isOffline
    ? { kind: "offline" }
    : result && result.requestKey === requestKey
      ? result.outcome
      : { kind: "loading" };

  return { state, retry, lastFetchedAt };
}
