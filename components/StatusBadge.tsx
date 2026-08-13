import type { StatusValue } from "@/lib/system-status/types";

// Status colors aren't in the client's confirmed token set (the Monitoring
// frame only shows Active/Provisioning, not this 4-value contract) — these
// are an original mapping using semantic green/amber/red, styled as a pill
// to match the "Active"/"Provisioning" badges seen elsewhere in the file.
const STYLES: Record<StatusValue, string> = {
  Operational: "bg-emerald-50 text-emerald-700",
  Degraded: "bg-amber-50 text-amber-700",
  "Major Outage": "bg-red-50 text-red-700",
  Unknown: "bg-grey-100 text-grey-600",
};

export function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
