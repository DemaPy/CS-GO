# Verification record

Each plan step with a stated pass condition, and the evidence it actually met.
Claims here are backed by recorded output, not inspection.

## Step 1 — scaffold and peer graph

| Check | Result |
|---|---|
| 1.4 one resolved `react` | `react@19.2.8`, single entry in `node_modules/.pnpm` |
| 1.4 one resolved `three` | `three@0.185.1`, single entry |
| 1.4 fiber/drei pair matched | `@react-three/fiber@9.7.0` + `@react-three/drei@10.7.8`, both peering React 19 |
| 1.4 no peer warnings | `pnpm install` re-run: no warnings naming react/three/fiber/drei |
| 1.6 `pnpm build` | exits 0 |

Stack: Next 16.3.4, React 19.2.8, Tailwind 4.3.3, TypeScript 5.9.3, Node 22.22.0,
pnpm 9.12.0.

## Step 2 — content model

- `tsc --noEmit` exits 0.
- Contiguity guard passes on the real `SECTIONS`.
- **Negative test:** feeding `assertContiguous` a deliberate `[0, 0.3]` → `[0.4, 1]`
  gap threw `Gap or overlap between "casing" (ends 0.3) and "arm" (starts 0.4)`.
  The guard is not a no-op that happens never to fire.
- `subProgress` clamps at both ends: `0.1 → 0`, `0.9 → 1` for range `[0.4, 0.6]`.

## Step 4.5 — rig purity

The plan asks for `seek(0.5)` twice to be bit-identical and `seek(1)` → `seek(0)`
to restore start transforms. Verified by comparing **all 16 `matrixWorld`
elements** of every named node after an explicit `updateMatrixWorld(true)` —
comparing `displayAnchor.position` alone would pass while a rotation drifted.

| Check | Result |
|---|---|
| 4.5a `seek(0.5)` twice → bit-identical | PASS |
| 4.5b `seek(1)` → `seek(0)` === `seek(0)` | PASS |
| 4.5c path independence: scrubbed 0.37 === direct 0.37 | PASS (added) |
| 4.5d 201 forward + 201 reverse seeks, all elements finite | PASS (added) |
| 4.5e all parts exactly seated (identity rotation) at `p=1` | PASS (added) |
| dispose() releases geometries, materials, children | PASS |

4.5c and 4.5d are beyond what the plan asks. Idempotence at a single value does
not prove path independence, and path independence is the property that actually
protects the "no snap-back when scrolling up" requirement.

## Step 5 — canvas, scroll, sections

Verified in Chrome against a **production build** (`next start`), not dev — the
console claim is about what ships.

| Check | Result |
|---|---|
| 5.3 five sections render | 5 `<section>` elements |
| 5.3 section 5 has no body copy | confirmed: heading only |
| 5.4 camera fills frame with panel at `p=1` | confirmed by screenshot |
| 5.6 no horizontal scrollbar @ 375×812 | `documentElement.scrollWidth === innerWidth === 375` at offsets 0, 0.5, 1 |
| 5.6 no element overflows viewport | no element with `right > innerWidth` or `left < 0` at any tested offset |
| 5.6 no section's copy overflows its viewport | tallest copy block 181px in an 812px section |

375×812 required CDP device-metrics emulation. `resize_page` clamps at 500px —
Chrome's minimum window width — so a plain resize silently tests the wrong
viewport and reports a false pass.

### Bugs found and fixed during Step 5

1. **Parts flew through the near plane.** Scatter transforms used `z = B.z*3.5`
   and `B.z*4.0` against a camera at `z=0.46`, so parts passed between the
   device and the lens and filled the frame as an unreadable black mass. Parts
   now scatter sideways, up, down, and behind — never forward. Documented as a
   constraint in `placeholder-rig.ts`.
2. **The harness crossed the headline.** It entered from off-frame left, dragging
   through the copy column. Now enters from the right.
3. **Mobile dimming faded the copy.** `<Canvas style={{opacity}}>` puts the style
   on R3F's *container* div, and drei injects the `<Scroll html>` overlay into
   that same container — so the headline dimmed with the device. Fixed with
   `.dim-device canvas { opacity: .35 }`, scoped to the canvas element.
   Verified: heading `opacity: 1` at `rgb(216, 212, 198)` (`--paper`), canvas
   `opacity: 0.35`.
4. **Part colours were placeholder greys**, not the Visual Direction palette.
   Now olive drab for charges, brass for harness and switch, near-black panel.
   The display green appears nowhere — Step 6 is its only appearance.

## Console state (production build)

- **Zero errors.**
- One warning: `THREE.Clock: This module has been deprecated. Please use
  THREE.Timer instead.` — emitted from inside `@react-three/fiber`'s render
  loop. Our code never touches `Clock`. Not fixable without an upstream release,
  so Step 8.5's "zero warnings" is met for first-party code only. Recorded
  rather than claimed clean.

`ReactDOMClient.createRoot()` double-call appears in **dev only** — React
StrictMode's double-mount. Absent from the production build. Confirmed by
running both.

## Not yet verified — needs a real device or user action

- **6.5** typing on the display on a physical phone. Desktop emulation cannot
  test the virtual-keyboard interaction, which is the known failure mode for a
  focused input inside drei's custom scroll container. Step 6.6 documents the
  fallback.
- **8.1** `prefers-reduced-motion` by toggling the OS setting. The code path
  exists and builds; the plan requires toggling the real setting, not the media
  query.
- **8.4** Lighthouse mobile ≥ 70.
- **7.5** the three email cases, which need Step 7 built first.

---

## Step 6 — the display in 3D space

Verified against a production build at 1280x800, 1440x900, 1680x720 and
390x844, reloading after each resize (see the caveat below).

| Check | Result |
|---|---|
| 6.1 real `<input type="email">` | `type=email`, `inputMode=email`, `autoComplete=email` |
| 6.2 inert before 0.85 | at p=0.84: `disabled`, `tabIndex=-1`, `aria-hidden=true`, `pointer-events: none` |
| 6.2 live after 0.85 | at p=0.90: enabled, `tabIndex=0`, `aria-hidden=false`, `pointer-events: auto` |
| 6.2 opacity ramp 0.80-0.90 | 0 at 0.80, 0.40 at 0.84, ~1.00 at 0.90 |
| 6.3 readout font | `DSEG14 Classic` confirmed loaded via `document.fonts.check` |
| 6.3 display green only here | `rgb(78, 226, 123)` = `--armed`; absent everywhere else |
| typing | value round-trips through React: `ops@example.com` |
| 8.2 focus ring | amber ring, unmistakable against the dark panel (screenshot) |
| blur on scroll-up | input loses focus when progress drops below 0.85 |

### DSEG7 -> DSEG14, a deliberate deviation from the plan

The plan specifies DSEG7 Classic. Shipped DSEG**14** Classic instead.

A seven-segment display physically cannot form most letters. `ops@example.com`
rendered as **`oPb@EHANPLE.coN`** — `s`->`b`, `x`->`H`, `m`->`N`. The visitor
could not read back the address they had just typed, on the one field that
decides whether they receive the product. Fourteen-segment displays exist for
exactly this reason. Same family, same licence, same segmented-LCD look, legible
letters. One font ships, not two (6KB).

### Panel framing — three attempts, recorded because the first two looked fine

1. **Fixed world offset** to push the panel clear of the copy column. Measured
   clean at 1440x900, clipped the headline everywhere else: a hardcoded offset
   cannot know the aspect ratio.
2. **Measured offset**, reading the copy column's real width from the DOM.
   Worse. Aiming the camera off-axis views the panel at an angle, and
   perspective then stretches its projected width ~40%, so the fit arithmetic
   was solving for the wrong number.
3. **Copy above the panel** (the operator's suggestion), camera dead centre,
   distance constrained on **both** axes. Width alone left only 16px between
   panel and headline at 1680x720, because a width-fitted panel grows
   vertically on short viewports.

### The Section 5 copy had to be pinned

drei scrolls the five 100vh blocks across a travel of (n-1) viewports, so the
last block is still sliding up through the middle of the frame exactly when the
display goes live. Moving the copy above the panel fixed the endpoint but not
the journey — at p=0.90 the heading sat 300px inside the lit panel.

`pinStageFive` counter-translates that block to its final position over
0.80-0.85 and holds it. Both terms are zero at 0.80, so it joins the natural
motion continuously rather than snapping. Verified at 1440x900:

| progress | pin | heading top | clearance | panel opacity |
|---|---|---|---|---|
| 0.75 | none | 999 (off-screen) | — | 0 |
| 0.80 | `ty 0` | 819 | — | 0 |
| 0.85 | `ty -540` | 99 | +50 | 0.5 |
| 0.90 | `ty -360` | 99 | +60 | 1 |
| 0.95 | `ty -180` | 99 | +87 | 1 |
| 1.00 | `ty 0` | 99 | +121 | 1 |

The node is resolved lazily, not in an effect: `Device` mounts inside the Canvas
before drei renders the `<Scroll html>` overlay, so an effect-time
`querySelector` returned null and the pin silently never applied. The first
"fixed" build measured identically to the broken one for that reason.

### Measurement caveats worth keeping

- **Reload after resizing.** `ScrollControls` computes page geometry on mount.
  Resizing without reloading reported the last section 320px above the viewport
  at 1680x720 — a stale-layout artifact, not a bug. Reloaded: `top: 0`.
- **`querySelector('h2')` grabs Section 1's heading**, which is scrolled far
  off-screen and yields a nonsense clearance that looks like a pass. Scope to
  `section:last-of-type`.
- **`resize_page` clamps at 500px.** Use CDP device-metrics emulation for
  anything narrower or a mobile test silently runs at the wrong width.

## Console state after Step 6

Zero errors on desktop and mobile, production build. Still exactly one warning:
the upstream `THREE.Clock` deprecation from inside `@react-three/fiber`.

---

## Step 7 — validation, capture, checkout

### 7.1/7.2 schema, verified in isolation (15 cases + 1 negative property)

| Input | Message |
|---|---|
| `notanemail` | that address is missing an @ |
| `""` / `"   "` | type an address first |
| `a@@b.co` | that address has more than one @ |
| `@example.com` | add the part before the @ |
| `ops@` | add the domain after the @ |
| `ops@example` | the domain needs a dot, like example.com |
| `ops@example.` / `ops@.com` | that domain has a stray dot |
| 250-char local part | that address is too long |
| `a@b.co`, `ops@example.com`, `OPS@Example.COM`, `  ops@example.com  `, `first.last+tag@sub.example.co.uk` | valid |

Also asserted as a property: **no message contains** "oops", "sorry",
"something went wrong", "invalid input" or "error". Error copy states what to
fix, per Step 7.2.

Normalisation confirmed: `"  OPS@Example.COM "` parses to `ops@example.com`.

### 7.3 route handler

| Request | Response |
|---|---|
| valid email | `200 {"ok":true,"stored":false}` |
| `notanemail` | `400 {"ok":false,"errors":{"email":["that address is missing an @"]}}` |
| `{}` | `400` — expected string, received undefined |
| malformed JSON | `400 {"errors":{"email":["send a JSON body"]}}` |

Server log confirms normalisation reached the provider layer:
`[capture] no audience configured; captured ops@example.com`.

### 7.5 the three cases, in a real browser against a production build

| Case | Result |
|---|---|
| `notanemail` | inline `that address is missing an @`, `aria-invalid=true`, **no** POST to `/api/capture`, no navigation, no Paddle frame |
| valid address | POST body `{"email":"ops@example.com"}` (trimmed + lowercased by the shared schema), no error, Paddle overlay opened |
| capture forced to **500** | POST fired, and the **overlay still opened** against `sandbox-buy.paddle.com` — a broken list provider does not block a sale |

Overlay confirmed visually: Test Mode, US$10.00, product "C4",
`ops3@example.com` pre-filled, "Sold by Paddle".

### Credential separation, verified in the built bundle

The plan's Stripe redirect became a Paddle overlay, which means a client SDK and
a public token. Checked what actually ships:

| Value | In `.next/static` | Correct? |
|---|---|---|
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | present | yes — public by design |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (`test_…`) | present | yes — public by design |
| `PADDLE_API_KEY` (`pdl_sdbx_apikey_…`) | **absent** | yes — server-only |
| `CAPTURE_RESEND_API_KEY` | **absent** | yes — server-only |

This matters because the operator initially supplied the Paddle **API key** for
the client-token slot. Two independent reasons not to: `NEXT_PUBLIC_` values are
compiled into the downloadable bundle (demonstrated above), and
`initializePaddle()` validates the token and rejects an API key, so checkout
would not have loaded at all.

### Test-harness trap worth recording

Dispatching an `input` event and calling `button.click()` synchronously reads
the **previous** React state, because the re-render has not committed. The first
run reported "type an address first" for input `notanemail`, and case 2 showed
case 1's error — both harness artifacts, not app bugs. Wait two animation frames
between typing and submitting.

---

## Step 7b — double opt-in for newsletter consent (Revision 4)

Operator changed the flow: capture an address, confirm it by email, and keep
the address off the list until confirmed. Chosen shape, after discussion:
**payment never waits.** The Paddle overlay opens immediately; the confirmation
email runs alongside it to earn marketing consent. Paddle already verifies the
buyer at checkout, so gating payment behind an inbox round-trip would cost
sales without buying fraud protection.

```
display: type address
   ↓  POST /api/capture          nothing stored yet
   ├─ Paddle overlay opens NOW   (email pre-filled)
   └─ Resend: confirmation email (React Email template)
           ↓  clicked whenever
      /api/confirm  → verify HMAC + expiry
           ↓
      Resend audience  ← the ONLY place a contact is created
           ↓  303
      /subscribed?state=confirmed
```

The load-bearing property: **an unconfirmed address never reaches the list.**
That is what makes the consent record defensible rather than asserted.

### Signed tokens, verified

Stateless HMAC-SHA256 over `{email, expiry}`, base64url, compared with
`timingSafeEqual`. No database.

| Check | Result |
|---|---|
| valid token round-trips to the address | PASS |
| payload swapped to `attacker@evil.test`, signature kept | rejected `bad-signature` |
| one signature character flipped | rejected `bad-signature` |
| minted 8 days ago | rejected `expired` |
| minted 6 days ago | still valid |
| `""`, `"."`, `nodot`, `a.`, `.b`, `a.b`, `!!!.???` | all rejected |

The forgery case is the one that matters: without it, anyone could edit a link
to subscribe an address they do not control.

### End-to-end over real HTTP

| Request | Result |
|---|---|
| valid confirm link | `303 → /subscribed?state=confirmed`, log `verified ops@example.com` |
| payload swapped, signature kept | `303 → state=invalid`, log `bad-signature` |
| `?t=nonsense` | `303 → state=invalid`, log `malformed` |
| `POST /api/capture` with `delivered@resend.dev` | `{"ok":true,"invited":true}` — real send accepted by Resend |
| `POST /api/capture` with `ops@example.com` | `invited:false`; Resend 422: `example.com` is a reserved test domain |

`/subscribed` renders distinct copy for `confirmed` / `expired` / `invalid`, is
`noindex, nofollow`, and whitelists the state param (an injected value falls
back rather than rendering). Note: the fallback is `confirmed`, so a direct
visit to `/subscribed` shows the success copy — cosmetic only, since audience
membership is the actual record and nothing is stored by that page.

### The email

`src/emails/confirm-address.tsx`, built with React Email. Warning-tape header,
brass-bordered housing, a green LED "NOT ARMED" status panel, an "Arm
subscription" button. A stylistic homage carrying no third-party game
trademarks, logos, or in-game lines — this is commercial mail for our own
product.

Rendered output checked against how email clients actually behave:

| Property | Value |
|---|---|
| HTML size | 6.2 KB |
| webfonts / `@font-face` | none — DSEG14 would silently fall back, so the readout uses a monospace stack |
| `<img>` tags | 0 — an image-blocked client still shows every word, including the button |
| `<style>` blocks | 0 |
| `class=` attributes | 0 — Gmail strips them |
| `display:flex` / `grid` | none |
| confirm URL occurrences | 2 (button + paste-in fallback) |
| preview text | present |

The plain-text part is rendered from the same component
(`render(el, { plainText: true })`), so it cannot drift from the HTML — which is
how hand-maintained text parts rot.

### Notes and caveats

- **Confirm-link logging is guarded by `NODE_ENV !== 'production'`.** The link
  grants the consent it represents, so it must not sit in production logs. This
  is why the end-to-end test ran against a dev server: `next start` sets
  production and correctly suppressed it.
- **`@react-email/components@1.0.12` installs with a deprecation warning**
  ("Package no longer supported") despite being the `latest` tag. It builds and
  typechecks; worth revisiting before relying on it further.
- **`CAPTURE_RESEND_AUDIENCE_ID` is still unset**, so `/api/confirm` verifies
  consent and logs it but stores nothing. Everything else in the chain is
  proven; this is one env var away from live.
- **Domain verification is still required** to mail arbitrary addresses.
  `onboarding@resend.dev` reaches only the account owner and Resend's own test
  addresses.
