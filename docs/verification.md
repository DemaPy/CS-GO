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

## Phase 2 (local only) — the glTF rig against real geometry

**This is not a Step 9 pass.** The model it runs on is the REJECTED Sketchfab
asset (`docs/asset-provenance.md`), used here only to exercise the
`AssemblyRig` seam against real geometry. Step 9.1 forbids shipping it.

The GLB lives at `public/models/dev-device.glb`, which is gitignored, so a fresh
clone has no model. **`USE_DEV_MODEL` in `Experience.tsx` is left `false`** so
the committed tree renders the placeholder and never fetches a URL that is not
there. Set it to `true` to see the real model locally. Note that only the asset
is protected by gitignore — the flag is not, and committing it as `true` gives
every clone and every deploy a 404 from `useGLTF`. `tsc`, `eslint` and
`next build` all pass either way, because none of them fetch that URL.

Built headless from the FBX with Blender 5.2.1: split by loose parts (56),
classified into the five `SectionId` groups by rules that each name a visible
feature, each group pivoted at its own bbox centre, plus a `DisplayAnchor`
parented to `panel`.

| Check | Result |
|---|---|
| groups tile the mesh | 56 parts = casing 24, charges 3, harness 7, panel 13, arm 9 |
| exported bounds match `REFERENCE_BOUNDS` | `[0.1655, 0.2498, 0.0814]`, centred on origin |
| longest axis on Y, panel toward +z | confirmed — exported Z-up so Blender's frame maps 1:1 to the placeholder's |
| name scrub (Step 11.4 grep) | `w_eq_c4`, `w_models`, `c4.png`, `weapons` all absent; 0 images, material renamed `device-body` |
| 4.5a `seek(0.5)` twice bit-identical | PASS |
| 4.5b `seek(1)` → `seek(0)` === `seek(0)` | PASS |
| 4.5c scrubbed 0.37 === direct 0.37 | PASS |
| 4.5d 402 seeks, all elements finite | PASS |
| 4.5e all five groups seated at p=1 | PASS |
| parts actually travel | panel moves 18.18 local units ≈ 0.42 m, the authored scatter |

Purity was re-run in the browser against the live rig, traversing **65 nodes**.
An earlier run of the same harness reported four passes while traversing **1**
node — the root had been emptied, so every comparison was of one node against
itself. A purity check on an empty scene graph passes trivially; the node count
is what makes the result mean anything.

### Two bugs this surfaced

- **`dispose()` must not be destructive here.** The rig `clone()`s the cached
  glTF scene, so it owns no geometries or materials — `root.clear()` freed
  nothing and only detached the model. Under StrictMode, which double-invokes
  effects while `useMemo` does *not* recompute, the cleanup emptied the very rig
  the remounted component went on using, and the scene rendered nothing. It is
  now a documented no-op. **The placeholder is not affected** — tested by
  flipping `USE_DEV_MODEL` to `false` and reloading: `root.children.length` is
  8, not 0. So this is specific to the glTF path, where `useGLTF` suspends and
  the component is re-rendered on resume without the memo being rebuilt. The
  placeholder never suspends, so its memo and its rig stay in step.

- **The display anchor must be unit-scale.** `DisplayPanel` is portalled into
  `displayAnchor`, so it inherits that node's scale. The first export carried
  its unit conversion as a scale on an ancestor (0.0231), which rendered the
  display shell ~43x too small.

  **The first fix for this was wrong and has been removed.** It cancelled the
  0.0231 by giving the anchor a local scale of 43.29. World scale then measured
  1.0000, which looked correct, but drei builds its CSS matrix from that node
  and a 43x local scale inside a 0.0231 parent inflated drei's container to
  ~6,000,000 x 7,300,000 px. The scale is now baked into the geometry on export
  instead, so no node carries one; `createGltfRig` checks this and warns rather
  than correcting it, because correcting it here is what caused the damage.

### Step 9.4 — the one-line swap does NOT hold

The plan asks whether swapping rigs is a one-line change needing no edits
elsewhere. It is not:

- `useGLTF` suspends, so the glTF path needs its own component to keep hook
  order stable. `Device` is now a branch over two wrappers.
- `Experience.tsx` had to learn a rig type it did not previously name.
- The anchor scale assumption above lived implicitly in `Experience.tsx`'s
  measured `PANEL_WIDTH` / `PANEL_HEIGHT` constants.

The seam mostly held — `Overlay.tsx`, `sections.ts` and `DisplayPanel.tsx` were
untouched, and `seek`/`displayAnchor` carried the real model unchanged. But the
leak is real and the plan says to fix it before Phase 3.

### What was seen in Chrome

Dev server, desktop viewport. Real geometry assembles across the five sections;
at p=1 the display lights and renders the DSEG14 `ADDRESS` readout, the input
line and the `ARM` button at roughly 67% of frame width (`PANEL_WIDTH_FRACTION`
targets 72%). The email input accepts typed text.

Not verified, and not claimed: the invalid-address inline error and the Paddle
overlay against this model — the readout intermittently rendered at a
near-zero CSS transform scale after interaction, and browser scripting was cut
short before the cause was found. It is not a stale portal left by HMR — there
was exactly one `input[type=email]` in the document at the time. Lighthouse,
mobile and reduced-motion (Step 8) were not run.

### Two bugs found while testing the model locally

**Stage four and stage five copy collide — pre-existing, not model-related.**
`pinStageFive` brings section five's copy to the top of the viewport over
0.80-0.85, but section five 100vh boxes travel only `(n-1)` viewports, so
section four's box does not clear the top until progress **1.0**. The two
therefore share the viewport, and their copy blocks intersect from
**p = 0.8321** to about 0.89, peaking around 120px — at 0.84 section five's
heading lands wholly inside section four's block.

`pinStageFive` and `Overlay.tsx` are untouched by the glTF work, so this is
Step 5 behaviour. It went unnoticed because the Step 5 checks were made at
p = 1.0, where section four is a full viewport above the fold and there is
nothing to see.

Fixed by fading section four's copy over `FADE_STAGE_FOUR = [0.80, 0.83]`,
which keeps the pin's purpose — section five still never slides through the lit
panel. **The first attempt at this fix was wrong**: a gentler `[0.80, 0.88]`
fade left section four 65% opaque when the overlap opened, which is the same
collision in lighter ink. Verified by sweeping progress in steps of 1e-4 and
asserting opacity is 0 at every value where the blocks intersect; `[0.80, 0.88]`
fails 432 of those samples, `[0.80, 0.83]` fails none.

**The readout blinked, vanished at full scroll, and flipped between viewport
widths of 1993 and 1994 — one cause, three symptoms.**

Three hypotheses were tested and rejected before the real one. Recorded because
each looked convincing:

1. *Occlusion grazing the keypad tiles.* The anchor cleared the 13-mesh panel
   group by 0.5 mm, about 3 degrees of angular margin. Standing it off 4 mm did
   not fix it, and disabling occlusion entirely did not either — so occlusion
   was exonerated by experiment, and the clearance was reverted.
2. *drei's container being millions of pixels.* True, but normal: the working
   state had one too.
3. *The 43x anchor scale.* A real defect (see above), fixed by baking the scale
   into the export — but not this bug.

The cause is that **drei's `Html` transform mode treats world units as CSS
pixels for translation**. `getObjectCSSMatrix` scales the basis by 1/40 and
leaves translation at x1, so a scene authored in metres put the camera 0.107
units — therefore 0.107 *pixels* — from a CSS perspective origin of 1772.9 px.
The readout sat 0.006% of the way from the eye plane at ~16,600x magnification,
where any sub-pixel float change pushes it to or past the eye and the browser
stops painting it.

Confirmed by modelling drei's maths and reproducing all three values from a
DOM dump taken in the broken state:

| | predicted | observed |
|---|---|---|
| perspective / outer `translateZ` | 1772.92 | 1772.78 |
| `matrix3d` scale | 0.000365 | 0.000365 |
| rendered shell width | 1453 px | 1453 px |

Fixed by authoring the scene in **millimetres**: every world-space value moved
by the same 1000x — `REFERENCE_BOUNDS`, `BASE_POS`, `PANEL_WIDTH`/`_HEIGHT`,
the camera position and near/far, both rigs' scatter offsets, the anchor
clearance, the `<Html>` scale, and the GLB export.

| | before | after |
|---|---|---|
| margin from the CSS eye plane | 0.107 px | 106.85 px |
| magnification | 16,592x | 17x |
| projected shell width | 1453 px | 1453 px |

The last row is the check that matters: the projected size goes as
`scale x P/(P - z)`, and `P - z` is the camera distance in world units, so
scaling both by 1000 cancels exactly. Ratios are unchanged, so the framing
maths and the on-screen size are untouched — only the numerical headroom moved.

Confirmed working by the operator at both 1993 and 1994 px.

`ReactDOMClient.createRoot()` errors ("called on a container that has already
been passed to createRoot") fire on every load. **They predate this work** —
they appear identically with `USE_DEV_MODEL = false` on the placeholder rig.
Dev-only, from the double-invoked R3F canvas container, but Step 8.5 asks for a
console-clean walk, so they are the next task's to clear.
