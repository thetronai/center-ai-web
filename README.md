# Center AI Vision — Monitoring (Web)

A responsive Next.js implementation of the Monitoring screen, reading live
service-status data from Center AI Vision's staging API. This is one half
of a two-repo trial deliverable — the corresponding React Native/Expo app
lives at [center-ai-mobile](https://github.com/thetronai/center-ai-mobile).

This screen is the **entire scope** of the trial (per the client's brief):
authentication, KYC, payments, and every other screen in the shared Figma
file are explicitly out of scope.

---

## Setup

Requires **Node 20+** and npm.

```bash
git clone https://github.com/thetronai/center-ai-web.git
cd center-ai-web
npm install
```

## Running it

```bash
npm run dev
```

Open **http://localhost:3000**. That's it — the Monitoring screen is the
root route.

The app calls `GET /config/system-status` on
`https://cav-backend-staging.onrender.com/api/v1` **server-side only**,
via a Next.js Route Handler at `app/api/system-status/route.ts`. The
browser never calls the upstream API directly — it has no
`Access-Control-Allow-Origin` header, so a client-side fetch fails, and
this also matches the client's stated production architecture (server
layer holds the token, browser never touches the API).

## How to force each state

The screen supports 5 states: `loading`, `success`, `empty`,
`error` (with retry), `offline`. Live data currently always returns the
success/happy path (`Operational` everywhere), so the other four are
reached with a `?scenario=` query param — this is a QA hook, not part of
the design, and isn't shown anywhere on screen:

| Scenario | URL |
|---|---|
| Live (default) | `http://localhost:3000/` |
| Loading (parked indefinitely, for screenshots) | `http://localhost:3000/?scenario=loading` |
| Empty (`[]` from the API) | `http://localhost:3000/?scenario=empty` |
| Error, with retry | `http://localhost:3000/?scenario=error` |
| Rate limited (429 + `Retry-After`) | `http://localhost:3000/?scenario=rate-limit` |
| Offline | `http://localhost:3000/?scenario=offline` |

Offline is also detected for real via `navigator.onLine` — turning off
your Mac's WiFi (or DevTools → Network → Offline) triggers it without the
query param.

## Architecture notes

- `lib/system-status/` — the typed contract (`Lane`, `StatusValue`,
  `SignalLevel`, `SystemService`) plus a runtime validator, since a fetch
  response is `unknown` until checked. No `any` anywhere in the codebase.
- `app/api/system-status/route.ts` — server-side proxy to the upstream
  API, with the `?force=` overrides the client hook uses to simulate
  empty/error/rate-limit without touching the real network.
- `hooks/useSystemStatus.ts` — the state machine. `loading`/`offline` are
  derived during render rather than pushed via `setState` inside an
  effect (React's own "you might not need an effect" guidance) — only the
  genuinely async fetch outcome uses `setState`, from inside its
  `.then()`/`.catch()`.
- `components/MonitoringView.tsx` — the screen: lane grouping
  (compute/mining/shared), a responsive card grid, status badges, and the
  10-segment signal bar.
- `components/StateScreen.tsx` — shared template for offline/error/empty,
  matching the confirmed Figma "Global States" frames.

## Figma correction

**Defect: insufficient text contrast on secondary/meta text (WCAG 2.1 AA failure).**

Figma dev-mode inspection confirms the meta/secondary text color used
throughout the file (e.g. the "Utilization 84% · Last reported Jul 31,
2026 · Infrastructure-provider reported" line under each service card) is
`#7A8299`, set at 12px regular weight on a white card background.

Computed contrast ratio: **`#7A8299` on `#FFFFFF` ≈ 3.83:1**.

WCAG 2.1 Level AA requires **4.5:1** for normal text. 12px regular is
well inside the "normal text" bracket (the 3:1 "large text" exception
only applies at 18pt/24px regular or 14pt/18.66px bold), so this text
falls short of AA — meaningfully harder to read for low-vision users, and
in bright ambient light on a phone screen.

**Why this is a real defect, not a nitpick:** the file's own Grey scale
already contains a token that fixes it without inventing a new color —
`grey-600 (#676B74)` computes to **≈5.34:1** against white, clearing AA
comfortably. This reads as a token-selection slip (a lighter shade than
the palette's own accessible options allow), not a deliberate design
choice, since nothing else in the file suggests this text is meant to be
de-emphasized to the point of an accessibility failure.

*(Annotated screenshot: grab a screenshot of the "GPU Service Status" or
"Compute Service Status" card region showing this meta text line,
highlight/circle it, and note the color + computed ratio — export/copy is
disabled on the file, so this has to be captured manually rather than
attached here.)*

## What I'd do differently with more time

- **Resolve the reservation-card vs. system-status data-model mismatch
  properly with the client.** The Monitoring frame's actual content
  (reservation cards, `Active`/`Provisioning` badges, no `shared` lane,
  no signal bar) doesn't match the API contract (8 named services, 3
  lanes, 4 status values, 10-entry signal history). I built the
  lane/status/signal-bar UI as an original design extension of the file's
  visual language rather than a literal match, since nothing in the file
  shows it — with more time I'd get this confirmed/redesigned by the
  client rather than inferring it.
- **Get real designs for the `loading` and `empty` states.** Only
  `offline` and `error` exist in the "Global States" frames; I
  extrapolated `loading` and `empty` from the same template for
  consistency, which is a reasonable stand-in but not a substitute for
  an actual design.
- **Nail down the exact cream/off-white background hex.** Export and
  copy are disabled on the file, so `#F6F5F0` is a close visual
  approximation, not a confirmed value.
- **Investigate the iOS Simulator networking issue at the root cause**
  rather than mitigating it with retries. The upstream API is behind
  Cloudflare with HTTP/3 advertised (`alt-svc: h3`), and iOS's QUIC
  negotiation over the Simulator's virtualized network intermittently
  drops the connection (`NSURLErrorNetworkConnectionLost`) — doesn't
  reproduce on Android, on a physical iPhone, or via `curl`. The mobile
  app retries a few times with backoff, which resolves it in practice,
  but a proper fix would go deeper into the native networking layer.
- **Add automated tests** — unit tests for the contract validator and
  the state machine's transitions, plus a visual regression pass across
  all 5 states.
- **Clean up unused mobile dependencies** (`expo-secure-store`,
  `@react-navigation/*`) left over from an earlier, since-superseded
  version of the brief that included a login flow.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Urbanist + Inter
(`next/font/google`)
