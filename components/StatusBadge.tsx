import type { StatusValue } from "@/lib/system-status/types";

// Neutral placeholder styling — swap for the real design tokens once the
// Monitoring frames' status colors are confirmed.
const STYLES: Record<StatusValue, string> = {
  Operational: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Degraded: "bg-amber-50 text-amber-700 border-amber-200",
  "Major Outage": "bg-red-50 text-red-700 border-red-200",
  Unknown: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
