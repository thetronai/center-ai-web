import type { SignalLevel } from "@/lib/system-status/types";

const COLORS: Record<SignalLevel, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  major: "bg-red-500",
};

/** Renders the 10-entry signal history, oldest (left) to newest (right). */
export function SignalBar({ signals }: { signals: SignalLevel[] }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Signal history: ${signals.join(", ")}`}>
      {signals.map((level, i) => (
        <span
          key={i}
          className={`h-4 w-3 rounded-sm ${COLORS[level]}`}
          title={level}
        />
      ))}
    </div>
  );
}
