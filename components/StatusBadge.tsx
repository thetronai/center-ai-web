import type { StatusValue } from "@/lib/system-status/types";

// Operational's bg/border pair is confirmed exact from Figma dev-mode
// inspection (#EDF7F2 / #C2E5D1). The other three aren't in the confirmed
// token set (the Monitoring frame only shows Active/Provisioning, not this
// 4-value contract) — extended the same bg+border+text pattern to them for
// visual consistency, using semantic amber/red/grey.
const STYLES: Record<StatusValue, string> = {
  Operational: "bg-[#EDF7F2] border-[#C2E5D1] text-emerald-700",
  Degraded: "bg-amber-50 border-amber-200 text-amber-700",
  "Major Outage": "bg-red-50 border-red-200 text-red-700",
  Unknown: "bg-grey-100 border-grey-200 text-grey-600",
};

export function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
