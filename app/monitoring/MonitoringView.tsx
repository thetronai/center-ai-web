"use client";

import Link from "next/link";
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

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
  { value: "rate-limit", label: "Rate limited" },
  { value: "offline", label: "Offline" },
];

function isScenario(value: string | null): value is Scenario {
  return SCENARIOS.some((s) => s.value === value);
}

function groupByLane(data: SystemService[]): Record<Lane, SystemService[]> {
  const groups: Record<Lane, SystemService[]> = { compute: [], mining: [], shared: [] };
  for (const service of data) {
    groups[service.lane].push(service);
  }
  return groups;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date) +
    " · " +
    new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function MonitoringView() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("scenario");
  const scenario: Scenario = isScenario(raw) ? raw : "live";
  const { state, retry, lastFetchedAt } = useSystemStatus(scenario);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Demo controls — not part of the design, lets every required state be reached on demand. */}
      <div className="border-b border-grey-200 bg-grey-900 px-4 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-grey-400">
            Demo: force state
          </span>
          <nav className="flex flex-wrap gap-1.5" aria-label="Demo state switcher">
            {SCENARIOS.map((s) => (
              <Link
                key={s.value}
                href={`/monitoring?scenario=${s.value}`}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  scenario === s.value
                    ? "bg-blue-500 text-white"
                    : "bg-grey-800 text-grey-300 hover:bg-grey-700"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <header className="border-b border-grey-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" aria-label="Back" className="text-grey-500 hover:text-grey-900">
            ←
          </Link>
          <h1 className="font-display text-lg font-bold text-grey-900">Monitoring</h1>
        </div>
      </header>

      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
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
              secondaryAction={{ label: "Back to Home", href: "/" }}
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
              secondaryAction={{ label: "Back", href: "/" }}
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
                    <ul className="space-y-3">
                      {services.map((service) => (
                        <li
                          key={service.name}
                          className="flex flex-col gap-3 rounded-2xl border border-grey-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
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
