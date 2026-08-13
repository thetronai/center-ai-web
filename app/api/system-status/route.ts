import { NextRequest, NextResponse } from "next/server";
import {
  fetchSystemStatus,
  RateLimitedError,
  UpstreamError,
} from "@/lib/system-status/fetchSystemStatus";
import type { SystemStatusResponse } from "@/lib/system-status/types";

/**
 * Server-side proxy for the upstream system-status API.
 *
 * The browser never calls the upstream API directly (no CORS headers there,
 * and in production this is where a server-held token would be attached).
 *
 * Demo-only: pass ?force=empty|error|rate-limit to reach the other required
 * states without waiting on the upstream API to actually degrade. See README.
 */
export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force");

  if (force === "empty") {
    return NextResponse.json<SystemStatusResponse>([]);
  }

  if (force === "error") {
    return NextResponse.json({ error: "Simulated upstream failure" }, { status: 500 });
  }

  if (force === "rate-limit") {
    return NextResponse.json(
      { error: "Simulated rate limit" },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }

  try {
    const data = await fetchSystemStatus();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: 429,
          headers:
            err.retryAfterSeconds !== null
              ? { "Retry-After": String(err.retryAfterSeconds) }
              : {},
        }
      );
    }

    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
