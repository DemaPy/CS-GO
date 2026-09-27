# Environment variables

Copy the block below into `.env.local.example`, then into `.env.local` with real
values. Claude cannot write these files directly — a permission deny rule covers
them — so this doc is the source of truth for the contract.

```bash
# ─── Checkout: Paddle ────────────────────────────────────────────────────────
# From Paddle > Developer tools > Authentication.
# The client token is safe to expose — it is scoped to client-side checkout.
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
# "sandbox" during development, "production" for live.
NEXT_PUBLIC_PADDLE_ENV=sandbox
# From Paddle > Catalog > Prices. Looks like pri_01h...
NEXT_PUBLIC_PADDLE_PRICE_ID=

# ─── Email capture: Resend ───────────────────────────────────────────────────
# Server-only. Never prefix with NEXT_PUBLIC_ — that ships the key to browsers.
CAPTURE_RESEND_API_KEY=
CAPTURE_RESEND_AUDIENCE_ID=

# ─── Site URL ─────────────────────────────────────────────────────────────────
# Public origin of the site, e.g. https://example.com. Used for the confirm link
# in the email AND as metadataBase for link-preview image URLs. Leave unset on
# Vercel to fall back to the production URL; must be absolute http(s) if set.
CAPTURE_SITE_URL=

# ─── The device: real 3D model, or procedural placeholder ────────────────────
# The one switch. Unset means on in development, off in production.
# Set false/0/off to render the placeholder boxes instead.
NEXT_PUBLIC_USE_DEV_MODEL=
# Optional. Which model to load when the switch is on; defaults to
# /models/dev-device.glb. Set this to the handcrafted production model.
NEXT_PUBLIC_DEVICE_MODEL_URL=
```

## Notes

**Paddle replaced the Stripe Payment Link** (Revision 3, 2026-09-07). Paddle has
no Stripe-style shareable payment link, so checkout goes through Paddle.js
(`@paddle/paddle-js`) as an overlay, opened with the email captured on the 3D
display via `customer: { email }`. No card fields live in this app. Consequences
for the plan:

- Step 7 is no longer a `window.location` redirect. It is
  `paddle.Checkout.open({ customer: { email }, items: [{ priceId, quantity: 1 }] })`.
- `initializePaddle()` must be lazy — called only when scroll progress crosses
  into Section 5, not on mount. Paddle.js is a client SDK and the plan's
  Step 8 Lighthouse ≥ 70 mobile floor is the constraint it threatens.
- Tokens and price IDs are environment-scoped. A sandbox `pri_...` does not
  exist in production, and a sandbox token with `NEXT_PUBLIC_PADDLE_ENV=production`
  makes checkout fail to load.
- Two Paddle dashboard settings gate checkout entirely, and neither is an env
  var: **Checkout > Website approval** (automatic in sandbox) and
  **Checkout > Checkout settings > Default payment link** (`https://localhost/`
  is fine for sandbox). Without them, checkout shows "Something went wrong".

**Resend replaced Mailchimp** (also Revision 3, 2026-09-07). Two values instead
of three, and no datacenter prefix embedded in the key.

- `CAPTURE_RESEND_API_KEY` — from https://resend.com/api-keys, starts with `re_`.
  "Sending access" covers transactional mail; adding a contact to an audience
  requires **Full access**, so pick that if `/api/capture` should store the
  address rather than just send.
- `CAPTURE_RESEND_AUDIENCE_ID` — from https://resend.com/audiences, a UUID.
  Optional: omit it and `/api/capture` validates and logs without storing.
- Sending *from* a domain needs that domain verified in Resend (DNS records).
  Until then Resend only permits `onboarding@resend.dev` as the from-address,
  and only to the account owner's own email — a sandbox that will look like a
  bug at Step 7 if it is not expected.
- Neither var may carry a `NEXT_PUBLIC_` prefix. That would ship the API key to
  every visitor's browser.

Until the key arrives, `/api/capture` validates with Zod, logs server-side, and
returns `{ ok: true }`; the client contract does not change when the provider is
wired up.

**Provisioning belongs in a webhook, not the post-checkout redirect.** Users
close tabs and block redirects. `transaction.completed` is the durable, signed,
retried event. Out of scope for Phase 1 — noted so it is not forgotten.

## Blocked

`plugin:paddle:paddle-live` failed to connect this session (rejected
Authorization header) and `paddle-docs` is unauthenticated. `paddle-sandbox` is
available. Real price IDs need one of those fixed.

## The device model

`src/lib/device-model.ts` is the only place these are read, and `Experience` is
the only thing that reads *it*. The switch used to be a hardcoded
`USE_DEV_MODEL` constant in `Experience`; it is an env var now because which
model is on screen is a deployment fact, not a source-code one — the local dev
asset and the handcrafted production asset are different files on different
machines, and `/public/models/` is gitignored, so the answer cannot be
committed.

| `NEXT_PUBLIC_USE_DEV_MODEL` | `NEXT_PUBLIC_DEVICE_MODEL_URL` | Result |
|---|---|---|
| unset, `next dev` | unset | `/models/dev-device.glb` |
| unset, `next build` | unset | placeholder rig |
| `false` / `0` / `off` / `no` | anything | placeholder rig |
| `true` / `1` / `on` | unset | `/models/dev-device.glb` |
| `true` / `1` / `on` | `/models/device.glb` | `/models/device.glb` |

**Unset means on in development, off in production**, and both halves are
deliberate. On in development so `next dev` shows the real device with no
setup — the two rigs are close enough in silhouette that "which one am I
looking at" is a real question, and the answer should not depend on remembering
to write a line in `.env.local`. Off in production because `dev-device.glb`
derives from the asset rejected at the Step 0 provenance gate
(`docs/asset-provenance.md`) and must never be deployed; shipping a model there
is an explicit act, which is exactly what the old `USE_DEV_MODEL = false` was
protecting. To ship the handcrafted model, set both vars in the production
environment.

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so a
changed value needs a fresh build — in dev, a page reload once the server has
restarted itself.

**Every load says which rig is on screen**, in dev only:

```
[device-model] loading /models/dev-device.glb
[device-model] placeholder — NEXT_PUBLIC_USE_DEV_MODEL is off
```

That line exists because a mistyped variable and a model that failed to load
look identical on screen, and a screenshot does not settle which rig it is.

**A model that fails is demoted, not fatal.** `DeviceModelBoundary` catches both
ways a swapped-in asset breaks — the URL 404s, or the export is missing one of
the five `SectionId` groups or the `DisplayAnchor` node — and falls back to the
placeholder with the reason on the console. Without it either one unmounts the
whole Canvas and the visitor gets copy scrolling over a blank page.

**What the model must contain** (see `src/three/assembly/gltf-rig.ts`):

- one node named for each `SectionId`: `casing`, `charges`, `harness`, `panel`,
  `arm`, each pivoted at its own bounding-box centre;
- a `DisplayAnchor` node parented to `panel`, at **unit world scale** — bake the
  unit conversion into the geometry on export rather than leaving a scale on a
  node, or the readout is mis-sized and unstable;
- authored so the longest dimension is ~250 in the scene's millimetre units.
  `charges` holding more than one mesh is a feature: those bricks get split into
  their own pivots and converge from three directions.
