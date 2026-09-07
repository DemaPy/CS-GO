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
