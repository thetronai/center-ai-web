"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSystemStatus, type Scenario } from "@/hooks/useSystemStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { SignalBar } from "@/components/SignalBar";
import { LANES, type Lane, type SystemService } from "@/lib/system-status/types";

const LANE_LABELS: Record<Lane, string> = {
  compute: "Compute",
  mining: "Mining",
  shared: "Shared",
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

export function MonitoringView() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("scenario");
  const scenario: Scenario = isScenario(raw) ? raw : "live";
  const { state, retry } = useSystemStatus(scenario);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Monitoring</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Status reflects the most recently reported data. Data may be delayed and does not
          guarantee uptime.
        </p>
      </header>

      {/* Demo controls — not part of the design, lets every required state be reached on demand. */}
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Demo state switcher">
        {SCENARIOS.map((s) => (
          <Link
            key={s.value}
            href={`/monitoring?scenario=${s.value}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              scenario === s.value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {state.kind === "loading" && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
            aria-hidden
          />
          Loading service status…
        </div>
      )}

      {state.kind === "offline" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-medium text-amber-800">You&apos;re offline</p>
          <p className="mt-1 text-sm text-amber-700">
            Check your internet connection. We&apos;ll keep showing this until you&apos;re back
            online.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-800">Couldn&apos;t load status</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          {state.retryAfterSeconds !== null && (
            <p className="mt-1 text-xs text-red-600">
              Retry after {state.retryAfterSeconds}s.
            </p>
          )}
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {state.kind === "empty" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          No services reported right now.
        </div>
      )}

      {state.kind === "success" && (
        <div className="space-y-8">
          {LANES.map((lane) => {
            const services = groupByLane(state.data)[lane];
            if (services.length === 0) return null;
            return (
              <section key={lane}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {LANE_LABELS[lane]}
                </h2>
                <ul className="space-y-3">
                  {services.map((service) => (
                    <li
                      key={service.name}
                      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900">{service.name}</span>
                        <StatusBadge status={service.status} />
                      </div>
                      <SignalBar signals={service.signals} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
