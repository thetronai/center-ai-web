"use client";

import { useSearchParams } from "next/navigation";
import { useSystemStatus, type Scenario } from "@/hooks/useSystemStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { SignalBar } from "@/components/SignalBar";
import { StateScreen } from "@/components/StateScreen";
import { WifiOffIcon, AlertIcon, InboxIcon } from "@/components/StateIcons";
import { LANES, type Lane, type SystemService } from "@/lib/system-status/types";

const LANE_LABELS: Record<Lane, string> = {
  compute: "Compute service status",
  mining: "Mining service status",
  shared: "Shared service status",
};

const SCENARIOS: readonly Scenario[] = [
  "live",
  "loading",
  "empty",
  "error",
  "rate-limit",
  "offline",
];

function isScenario(value: string | null): value is Scenario {
  return (SCENARIOS as readonly string[]).includes(value ?? "");
}

function groupByLane(data: SystemService[]): Record<Lane, SystemService[]> {
  const groups: Record<Lane, SystemService[]> = { compute: [], mining: [], shared: [] };
  for (const service of data) {
    groups[service.lane].push(service);
  }
  return groups;
}

function formatTimestamp(date: Date): string {
  return (
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
      date
    ) +
    " · " +
    new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date)
  );
}

/**
 * The Monitoring screen — the single screen in scope for this trial.
 *
 * `?scenario=` isn't part of the design; it's a QA hook so every required
 * state (loading/empty/error/rate-limit/offline, in addition to the live
 * happy path) can be reached on demand. See README "How to force each
 * state" — there's no on-screen control for it, to keep the actual screen
 * matching the design.
 */
export function MonitoringView() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("scenario");
  const scenario: Scenario = isScenario(raw) ? raw : "live";
  const { state, retry, lastFetchedAt } = useSystemStatus(scenario);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-grey-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-lg font-bold text-grey-900">Monitoring</h1>
        </div>
      </header>

      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {state.kind === "loading" && (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-grey-500">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-grey-300 border-t-blue-500"
                aria-hidden
              />
              Loading service status…
            </div>
          )}

          {state.kind === "offline" && (
            <StateScreen
              icon={WifiOffIcon}
              tone="grey"
              heading="You're offline"
              body="Check your internet connection and try again. Previously loaded information may still be available."
              infoBox={
                lastFetchedAt
                  ? `Last updated ${formatTimestamp(lastFetchedAt)}. Live data is unavailable while offline.`
                  : undefined
              }
              primaryAction={{ label: "Try Again", onClick: retry }}
            />
          )}

          {state.kind === "error" && (
            <StateScreen
              icon={AlertIcon}
              tone="red"
              heading="Something went wrong"
              body="We couldn't load this information. Please try again."
              infoBox={
                <>
                  {state.message}
                  {state.retryAfterSeconds !== null && ` Retry after ${state.retryAfterSeconds}s.`}
                </>
              }
              primaryAction={{ label: "Try again", onClick: retry }}
            />
          )}

          {state.kind === "empty" && (
            <StateScreen
              icon={InboxIcon}
              tone="grey"
              heading="No services reported"
              body="There's no service status data to show right now."
              primaryAction={{ label: "Refresh", onClick: retry }}
            />
          )}

          {state.kind === "success" && (
            <div className="space-y-6">
              {LANES.map((lane) => {
                const services = groupByLane(state.data)[lane];
                if (services.length === 0) return null;
                return (
                  <section key={lane}>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-500">
                      {LANE_LABELS[lane]}
                    </h2>
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {services.map((service) => (
                        <li
                          key={service.name}
                          className="flex flex-col gap-3 rounded-2xl border border-grey-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm font-bold text-grey-900">
                              {service.name}
                            </span>
                            <StatusBadge status={service.status} />
                          </div>
                          <SignalBar signals={service.signals} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

              <p className="pt-2 text-xs text-grey-500">
                Status reflects the most recently reported data. Data may be delayed and does not
                guarantee uptime.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
