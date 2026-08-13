import { parseSystemStatusResponse, type SystemStatusResponse } from "./types";

export const SYSTEM_STATUS_API_URL =
  "https://cav-backend-staging.onrender.com/api/v1/config/system-status";

const REQUEST_TIMEOUT_MS = 12000;

export class RateLimitedError extends Error {
  retryAfterSeconds: number | null;

  constructor(retryAfterSeconds: number | null) {
    super("Rate limited by upstream system-status API");
    this.name = "RateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class UpstreamError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

/**
 * Calls the live system-status endpoint. Must run server-side only (Route
 * Handler / Server Component) — the upstream API returns no
 * Access-Control-Allow-Origin header, so a browser-side call fails.
 *
 * Times out and surfaces as an UpstreamError if the request hangs — the
 * mobile app was observed stalling indefinitely on this endpoint's
 * chunked/keep-alive response without ever resolving or rejecting, so the
 * same defense is applied here even though it hasn't been observed on web.
 */
export async function fetchSystemStatus(
  signal?: AbortSignal
): Promise<SystemStatusResponse> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  // Combine the caller's signal (if any) with our own timeout, so either one aborts the request.
  const onCallerAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", onCallerAbort);

  let response: Response;
  try {
    response = await fetch(SYSTEM_STATUS_API_URL, {
      signal: timeoutController.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (timeoutController.signal.aborted) {
      throw new UpstreamError("Request to upstream timed out.");
    }
    throw new UpstreamError(
      err instanceof Error ? err.message : "Network request to upstream failed"
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers.get("Retry-After");
    throw new RateLimitedError(retryAfterHeader ? Number(retryAfterHeader) : null);
  }

  if (!response.ok) {
    throw new UpstreamError(`Upstream responded with ${response.status}`, response.status);
  }

  const data: unknown = await response.json();
  return parseSystemStatusResponse(data);
}
