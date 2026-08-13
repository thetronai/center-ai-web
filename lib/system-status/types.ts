// Contract for GET /config/system-status, as specified by the client.
// https://cav-backend-staging.onrender.com/api/v1/config/system-status

export type Lane = "compute" | "mining" | "shared";

export type StatusValue = "Operational" | "Degraded" | "Major Outage" | "Unknown";

export type SignalLevel = "good" | "warn" | "major";

export interface SystemService {
  name: string;
  lane: Lane;
  status: StatusValue;
  /** Always 10 entries, oldest to newest. */
  signals: SignalLevel[];
}

export type SystemStatusResponse = SystemService[];

export const LANES: readonly Lane[] = ["compute", "mining", "shared"];
export const STATUS_VALUES: readonly StatusValue[] = [
  "Operational",
  "Degraded",
  "Major Outage",
  "Unknown",
];
export const SIGNAL_LEVELS: readonly SignalLevel[] = ["good", "warn", "major"];

function isLane(value: unknown): value is Lane {
  return typeof value === "string" && (LANES as readonly string[]).includes(value);
}

function isStatusValue(value: unknown): value is StatusValue {
  return typeof value === "string" && (STATUS_VALUES as readonly string[]).includes(value);
}

function isSignalLevel(value: unknown): value is SignalLevel {
  return typeof value === "string" && (SIGNAL_LEVELS as readonly string[]).includes(value);
}

function isSystemService(value: unknown): value is SystemService {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    isLane(record.lane) &&
    isStatusValue(record.status) &&
    Array.isArray(record.signals) &&
    record.signals.every(isSignalLevel)
  );
}

/**
 * Validates an unknown JSON payload against the system-status contract.
 * Throws if the shape doesn't match, rather than trusting the network blindly.
 */
export function parseSystemStatusResponse(data: unknown): SystemStatusResponse {
  if (!Array.isArray(data) || !data.every(isSystemService)) {
    throw new Error("Unexpected response shape from system-status endpoint");
  }
  return data;
}
