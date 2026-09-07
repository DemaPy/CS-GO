# C4 Scroll Landing Page — Implementation Plan

**Goal:** A five-section, scroll-driven 3D landing page where a detonator assembles as the visitor scrolls, ending with an email captured on the device's lit display and a redirect to Stripe checkout. Executed by a coding agent with no prior context on this project.

**Deliverable:** A running Next.js app in the repo root, `pnpm dev` clean, `pnpm build` clean. Phase 1 ships with a procedural placeholder model; the real asset swaps in at Phase 3 by changing one rig implementation.

**Revision 2 (2026-09-07):** Two free Sketchfab C4 models were inspected and both rejected — see Step 0. Asset selection moved from Phase 3 to a blocked-first step, and a mandatory file-level vetting gate added.

**Revision 3 (2026-09-07):** Operator decisions and one empirical correction.

- **Checkout is Paddle, not Stripe.** Paddle has no Stripe-style shareable payment link, so the "plain URL redirect, no SDK" constraint no longer holds. Checkout is a Paddle.js overlay opened with the captured email. Step 7 changes shape — see the revised Constraints bullet and `docs/env-vars.md`.
- **Email capture is Resend, not Mailchimp.** Two env vars, no datacenter prefix.
- **Asset path is the H.Reyes candidate**, pending the Step 0.6 written permission. A second Sketchfab candidate (5 MB original-format FBX, listing not yet identified) is awaiting inspection.
- **Step 3.5's premise is false.** It claims `By Loose Parts` returns one object because game world models are one welded surface. Measured by edge-walk on `C4-1.fbx`: **56 connected components**. Splitting that file is still pointless, but because gate 0.2 rejects it on provenance — not because it cannot be split. See `docs/asset-provenance.md`.
- **Blender is available and scriptable.** `/Applications/Blender.app` runs headless (`--background --factory-startup --python`), so Steps 0.1 (`.blend`→FBX export) and 3.2–3.4 need no manual GUI work.
- **Reference dimensions measured.** `C4-1.fbx` imports at 10.81 m longest — ~43× oversized, the exact failure Step 3.2 predicts. Correction factor `0.0231`; corrected bounds `0.1655 × 0.2500 × 0.0814 m`. Aspect ratio is a framing approximation, not a real-world measurement.

**Definition of done:**
- Scrolling the page drives the assembly forward and backward with no visible jump, stutter, or snap-back at any point in 0→1→0.
- The five sections' copy and their scroll ranges come from one file (`src/content/sections.ts`), not from values scattered in components.
- At scroll progress ≥ 0.85 the display is lit, focusable, and accepts typed text — verified on a real physical phone, not a desktop devtools emulation.
- A valid email submits, and the browser lands on the Stripe-hosted checkout with the address prefilled.
- An invalid email shows an inline error on the display and does not navigate.
- `prefers-reduced-motion: reduce` renders the fully assembled device with no scrub, and the email step is still reachable.
- Lighthouse performance ≥ 70 on mobile, and no console errors or React key/hydration warnings on any section.
- The shipped model passed the Step 0 vetting gate: `fbx_inspect.py` output is recorded in `docs/asset-provenance.md`, showing no engine-derived internal names and the object count the assembly needs.
- If the shipped model's license requires attribution, the credit string appears in the page footer and in the repo README, and matches the licensor's required form.

**Brief:** No separate brief file exists. The brief is the conversation of 2026-09-07, summarised verbatim in Constraints below. The plan argues from that section.

## Constraints

- Stack is Next.js App Router + TypeScript, matching the operator's day-to-day stack. Zod for all input validation.
- 3D via `@react-three/fiber` and `@react-three/drei`. No Spline, no Theatre.js — `@theatre/r3f` is pre-release and unpublished for roughly two years, and this page carries a payment funnel.
- Scroll assembly is driven by scrubbing a timeline against scroll progress, never by fire-once triggers. Scrolling up must reverse the assembly exactly.
- The email input sits on the device's green display in 3D space, not in a separate form below the canvas.
- Five sections. Scroll ranges: 0.00–0.20, 0.20–0.40, 0.40–0.60, 0.60–0.80, 0.80–1.00.
- Phase 1 must be buildable and testable **before** any real 3D asset exists. The model is a swappable dependency behind one interface.
- ~~Checkout is a Stripe Payment Link — a plain URL redirect. No Stripe SDK, no card fields in this app.~~ **Superseded by Revision 3.** Checkout is Paddle. Paddle offers no shareable prefillable payment link, so the flow is `@paddle/paddle-js` opening an overlay via `Paddle.Checkout.open({ customer: { email }, items: [{ priceId }] })`. Still no card fields in this app — Paddle's iframe owns them. Two consequences: `initializePaddle()` must be **lazy**, called only when scroll crosses into Section 5, because Step 8's Lighthouse ≥ 70 mobile floor is what a client SDK on first load threatens; and provisioning belongs in a `transaction.completed` webhook, never the post-checkout redirect.
- **No asset ships without passing the Step 0 gate.** A listing's stated license is not evidence. Two free Sketchfab C4 models have already been inspected and rejected: `ca14fcc2…` (Valve-credited, rigged, single skinned mesh) and `617d7546…` (described as original Blender/Substance work, but the file carries `models/weapons/w_eq_c4`, `materials/models/weapons/w_models/w_c4/c4`, and `c4.png` — Source engine pathing, so it is a decompiled Valve asset and its CC Attribution grant is void). Both are approved as **local development placeholders only**, must never be committed, and must never be deployed.
- Out of scope: CMS, i18n, analytics, A/B testing, auth, a database.

---

## Inputs Map

| Source | Status | What it provides |
|---|---|---|
| Product name, one-line pitch, price | **need the user** | All section copy and the checkout label |
| Stripe Payment Link URL | **need the user** | `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` |
| Email list destination (Resend / Mailchimp / sheet / none) | **need the user** | `/api/capture` behaviour |
| **A shippable 3D model** | **need the user** — unresolved, see Step 0 | The only asset allowed past Phase 2 |
| `fbx_inspect.py` | **have it** | The Step 0 vetting gate — reads FBX object names and counts with no dependencies |
| `C4-1.fbx` (`617d7546…`) | **have it** — dev placeholder only | Silhouette and framing reference |
| DSEG7 Classic font (SIL OFL) | **need to fetch** | Seven-segment face for the display readout |
| `@gltf-transform/cli`, `gltfjsx` | **need to fetch** (npx, no install) | GLB inspection and Draco optimisation |

**Fallbacks:**
- Product details missing at execution time → use the placeholder copy in Step 2 verbatim, marked `TODO(copy)` in a single block comment at the top of `sections.ts`. Do not invent a product name that reads as final.
- Payment Link missing → point `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` at `https://example.com/checkout` and confirm the redirect fires with the right query string. The flow is testable without a real link.
- List destination missing → `/api/capture` validates, logs server-side, returns `{ ok: true }`. The client contract does not change when a provider is added later.
- **No vetted model by the time Phase 1 is done** → this does not block anything. Steps 1–8 build and pass against the procedural placeholder. Phase 2 is skipped and Phase 3 waits. Do not substitute a rejected asset to unblock progress.

**Blocked-first note:** every "need the user" row is resolved in Step 0 or Step 1. Nothing from Step 2 onward waits on the user. The asset question is now first rather than last, because it has already produced two dead ends and it is the only item with a procurement lead time.

---

## Phase 0 — Setup and contracts

### Step 0: Vet and select the shippable model

**Sources:**
- Run: `python3 fbx_inspect.py <candidate>.fbx` (script provided, no dependencies)
- Candidates, in evaluation order: [H.Reyes C4 Explosive Devices](https://sketchfab.com/3d-models/c4-explosive-devices-9c2fc915e2434983b043f0f106581bba) (free, `.blend`, live Box Cutter / Hard Ops modifiers, original work, informal license); [ninashaw C4 Explosive with Detonator](https://sketchfab.com/3d-models/c4-explosive-with-detonator-2ec04bbae6124bb98733183de034d450) (paid, royalty-free, listing claims logically-named grouped objects); commission as fallback.

**Produces:** `docs/asset-provenance.md` — the inspector output for the selected model, the license, and the attribution string if one is required.

**Consumes:** nothing. Runs first, in parallel with Steps 1–2.

- [ ] **0.1** Run the inspector on the candidate. Record the full output verbatim in `docs/asset-provenance.md`. For `.blend`-only candidates, export FBX from Blender first and inspect that.
- [ ] **0.2 — Provenance gate.** Read the Model, Material, and Texture names in the output. **Reject** on any engine-derived pathing: `models/weapons/…`, `materials/models/…`, `w_*` prefixes, `v_*` prefixes, or any nested directory structure resembling a game's asset tree. Correct answer for an original model: flat, human-authored names like `Casing`, `Charge_01`, `Panel`, `Wire_Harness`. This check overrides the listing's license field in every case — two candidates have already passed the license field and failed here.
- [ ] **0.3 — Split gate.** Count mesh objects. **Reject** at 1 or 2 unless the source is a `.blend` with live modifiers, in which case the modifier stack is the split and the count is not meaningful. Correct answer: 5 or more separately named meshes mapping onto the `SectionId` groups from Step 2, or a `.blend` whose Outliner shows separate component objects.
- [ ] **0.4 — Close-up gate.** Check triangle count and texture resolution. Reject below ~15k triangles: the Section 5 camera fills the frame with the display panel, and a 4k-triangle game world model reads as flat at that distance. The panel is getting custom geometry regardless (Step 6.3), but the surrounding casing still has to hold up.
- [ ] **0.5** If the license requires attribution, paste the licensor's exact required credit string into `docs/asset-provenance.md`. On Sketchfab this is the **COPY CREDITS** button in the download dialog — use its output verbatim rather than composing one.
- [ ] **0.6** If the license is informal (a description sentence rather than a named license), get written permission before this asset enters `public/`. A comment reply or email naming commercial use on a paid landing page is sufficient; a permissive-sounding sentence in a model description is not. Record the permission text in `docs/asset-provenance.md`.
- [ ] **0.7** If every candidate fails, stop evaluating free assets and commission (Step 10). Do not spend more than two candidates' worth of effort here — the pattern so far is that every free CS2-derived C4 is the same decompiled Valve asset re-uploaded, and the inspector will keep saying so.

### Step 1: Repo scaffold, resolved dependencies, and answers to the three blocked questions

**Sources:**
- Ask the user: product name, one-line pitch, price, Stripe Payment Link URL, email-list destination.

**Produces:** A Next.js + TypeScript app that boots, with `three`, `@react-three/fiber`, `@react-three/drei`, `zod`, and Tailwind installed at mutually compatible versions. `.env.local.example`.

**Consumes:** nothing.

- [ ] **1.1** Ask the user the five questions above in one message. If unanswered, proceed under the Step-1 fallbacks and note it in the handoff.
- [ ] **1.2** Scaffold: `pnpm create next-app@latest . --ts --tailwind --app --eslint --no-src-dir=false`.
- [ ] **1.3** Install the 3D stack in **one** command so the resolver sees all peers at once: `pnpm add three @react-three/fiber @react-three/drei && pnpm add -D @types/three`.
- [ ] **1.4** Verify the peer graph before writing any 3D code. Run `pnpm why react` and `pnpm why three`. The single most common failure on this stack is a `@react-three/fiber` major that requires a different React major than Next scaffolded, with `@react-three/drei` pinned to the other one. Correct answer: exactly one resolved version of `react`, one of `three`, and `pnpm install` exits 0 with no peer warnings mentioning these three packages. If there are warnings, downgrade `@react-three/fiber` and `@react-three/drei` together to the pair that matches the installed React major — never one without the other.
- [ ] **1.5** Write `.env.local.example` with `NEXT_PUBLIC_STRIPE_PAYMENT_LINK=` and a commented `CAPTURE_PROVIDER_KEY=`. Copy to `.env.local`.
- [ ] **1.6** Confirm `pnpm dev` serves the default page and `pnpm build` exits 0. Both must pass before Step 2.

### Step 2: Content model — the single source of truth for copy and timing

**Sources:**
- Product answers from Step 1.

**Produces:** `src/content/sections.ts`

**Consumes:** Step 1 scaffold.

- [ ] **2.1** Define the type and the five entries. Every later step reads timing from here; no component may hardcode a progress number.

```ts
export type SectionId = 'casing' | 'charges' | 'harness' | 'panel' | 'arm'

export interface Section {
  id: SectionId
  /** inclusive start, exclusive end, of overall scroll progress 0..1 */
  range: [number, number]
  eyebrow: string
  heading: string
  body: string
}

export const SECTIONS: Section[] = [ /* five entries, ranges per Constraints */ ]
```

- [ ] **2.2** Placeholder copy, to be used verbatim if Step 1.1 went unanswered. Keep it short — long paragraphs fight a scrub animation for attention.

| # | Eyebrow | Heading | Body |
|---|---|---|---|
| 1 | Stage one | Nothing here is armed yet | A shell, machined and empty. Scroll to build it. |
| 2 | Stage two | Four charges, seated | Each block locks to a face. The weight is real now. |
| 3 | Stage three | Wired through | One harness, one path, no redundancy. |
| 4 | Stage four | The panel goes in | Dark until it has power. It has no reason to trust you yet. |
| 5 | Stage five | Arm it | Type the address that receives the key. |

- [ ] **2.3** Add a single `// TODO(copy): replace once product name and price are confirmed` block at the top of the file if placeholders were used. One marker, not five.
- [ ] **2.4** Check: `SECTIONS` ranges are contiguous and cover exactly `[0, 1]` with no gap and no overlap. Write a one-line assertion in a `vitest` test or an inline `if` that throws in dev. Correct answer: `SECTIONS[i].range[1] === SECTIONS[i+1].range[0]` for all `i`, first start is `0`, last end is `1`.

### Step 3: Reference geometry for framing

**Sources:**
- `C4-1.fbx` — the already-inspected `617d7546…` asset. **Rejected for shipping** (Step 0.2: Source engine pathing; Step 0.3: single 4,020-triangle mesh). Retained only for silhouette and camera framing.

**Produces:** `.local/reference.glb`, plus recorded overall dimensions.

**Consumes:** nothing. Runs in parallel with Steps 1–2.

- [ ] **3.1** Add `.local/` to `.gitignore` **before** copying the file in. This asset must not enter git history.
- [ ] **3.2** Import the FBX into Blender and check scale in the N-panel. FBX unit metadata is frequently misread on import, landing the model 100× off. Correct answer: longest dimension roughly 0.2–0.3m. If it is 20m or 0.002m, scale and `Object → Apply → All Transforms` now — every later keyframe and camera position is in this space.
- [ ] **3.3** Record the corrected bounding-box dimensions in `docs/asset-provenance.md`. Step 4's placeholder boxes are sized from these numbers, so the placeholder frames like the real thing and Step 5.4's camera path survives the Phase 3 swap.
- [ ] **3.4** Export to `.local/reference.glb` and load it in the scene once, alongside the placeholder, to confirm framing. Then remove it. It is a ruler, not a dependency.
- [ ] **3.5** Do not attempt `P → By Loose Parts` on this mesh. A game world model is authored as one continuous welded surface precisely so that it has no loose parts; the operation returns one object and the time is wasted.

---

## Phase 1 — The rig, with placeholder geometry

### Step 4: The assembly rig interface and its placeholder implementation

**Sources:**
- `src/content/sections.ts` from Step 2.

**Produces:** `src/three/assembly/types.ts`, `src/three/assembly/placeholder-rig.ts`

**Consumes:** Step 2 content model.

- [ ] **4.1** Define the seam that makes the model swappable. This is the point of Phase 1 — every later phase changes only which implementation is constructed.

```ts
import type { Object3D } from 'three'

export interface AssemblyRig {
  /** the object to mount in the scene */
  readonly root: Object3D
  /** absolute seek — must be idempotent and direction-agnostic */
  seek(progress: number): void
  /** world-space anchor for the display panel */
  readonly displayAnchor: Object3D
  dispose(): void
}
```

- [ ] **4.2** Implement `createPlaceholderRig(): AssemblyRig` — five `BoxGeometry` parts sized to read as a shell, four charges, a harness bar, and a panel. Each part gets a scattered start transform and a seated end transform, and `seek` lerps between them over that part's own sub-range taken from `SECTIONS`.
- [ ] **4.3** Ease each part's sub-progress with a smoothstep, not linear. Linear lerp reads as mechanical sliding; the parts should settle.
- [ ] **4.4** `displayAnchor` is an `Object3D` parented to the panel box, positioned flat on its front face. Everything downstream reads the panel's placement from this, so no component hardcodes display coordinates.
- [ ] **4.5** Check: `seek(0.5)` called twice in a row produces identical world matrices, and `seek(1)` then `seek(0)` returns every part to its exact start transform. Log the panel's world position at those three calls and compare. Correct answer: bit-identical for the repeated call, and the `seek(0)` values match the initial values.

### Step 5: Canvas, scroll plumbing, and the five HTML sections

**Sources:**
- `SECTIONS` from Step 2, `createPlaceholderRig` from Step 4.

**Produces:** `src/components/Experience.tsx`, `src/components/Overlay.tsx`, `src/app/page.tsx`

**Consumes:** Steps 2 and 4.

- [ ] **5.1** `Experience.tsx`: a `<Canvas>` containing `<ScrollControls pages={5} damping={0.25}>`, the rig mounted inside, and `<Scroll html>` wrapping `<Overlay />`.
- [ ] **5.2** Drive the rig from one place only:

```tsx
const scroll = useScroll()
useFrame(() => { rig.seek(scroll.offset) })
```

- [ ] **5.3** `Overlay.tsx` maps over `SECTIONS` and renders five full-viewport blocks. Section 5's block is empty of copy below the heading — the input lives in the 3D scene, not here.
- [ ] **5.4** Camera: keep it static through sections 1–4 and interpolate position only across 0.80–1.00, pushing toward `displayAnchor`. A camera that moves the whole way competes with the assembly and makes both hard to read.
- [ ] **5.5** Check the reversal requirement explicitly. Scroll slowly to the bottom, then slowly back to the top, then fast in both directions. Correct answer: no part ever jumps, overshoots past its seated transform, or fails to return. If a part sticks, `seek` is holding state it shouldn't — it must be a pure function of `progress`.
- [ ] **5.6** Check: resize the window from 1440px to 375px wide while mid-scroll. The device stays framed and no section's copy overflows its viewport. Correct answer: no horizontal scrollbar at any width, at any scroll position.

### Step 6: The display — input in 3D space

**Sources:**
- DSEG7 Classic from `https://github.com/keshikan/DSEG` (SIL OFL) → `public/fonts/`.
- `displayAnchor` from Step 4.

**Produces:** `src/components/DisplayPanel.tsx`

**Consumes:** Step 4 rig, Step 5 scroll progress.

- [ ] **6.1** Mount a `<Html transform occlude>` on `displayAnchor`, containing a real `<input type="email" inputMode="email" autoComplete="email">`. A real DOM input is required — it brings the correct mobile keyboard, autofill, and paste for free, and reimplementing a caret in a texture costs days.
- [ ] **6.2** Gate it on progress: `pointerEvents: progress >= 0.85 ? 'auto' : 'none'`, opacity ramped over 0.80–0.90. Before that the panel is dark and inert, and must not be tabbable — set `tabIndex={-1}` and `aria-hidden` until active, or keyboard users land inside an invisible input at the top of the page.
- [ ] **6.3** Style the readout with DSEG7 on a dark panel, letter-spaced. This is the one place the display green appears (see Visual Direction) — it is the payoff, so nothing earlier on the page may use it.
- [ ] **6.4** Tune `occlude` against the panel geometry at the final camera position. `occlude` is a raycast approximation and will show artefacts at grazing angles. Because the camera is fixed for section 5 by Step 5.4, this is a one-time tune, not a per-frame problem.
- [ ] **6.5 — Mobile gate.** Load on a physical phone. Scroll to section 5, tap the display, and type. Correct answer: the keyboard opens, characters appear on the panel, and the page does not scroll-jump or zoom when the input takes focus.
- [ ] **6.6 — Documented fallback for 6.5.** `ScrollControls` runs its own scroll container, and a focused input inside a custom scroll container plus a virtual keyboard is the known failure mode on this stack. If 6.5 fails, do **not** debug it for more than an hour. Switch to: display shows a tap target, tapping opens a full-viewport overlay styled identically to the panel with the input at the top of the layout, and dismissing returns to the scene at the same progress. Record which path was taken in the handoff.

### Step 7: Validation, capture, and the redirect

**Sources:**
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` from Step 1.

**Produces:** `src/lib/schema.ts`, `src/app/api/capture/route.ts`, submit handler in `DisplayPanel.tsx`

**Consumes:** Step 6 input.

- [ ] **7.1** `schema.ts`: `export const CaptureInput = z.object({ email: z.string().trim().toLowerCase().email() })` and its inferred type. Both the client handler and the route handler import this same schema — one definition, two call sites.
- [ ] **7.2** Client: validate with `CaptureInput.safeParse` before any network call. On failure, render the Zod message on the panel itself and do not navigate. Error copy states what to fix, not an apology — "that address is missing an @", not "oops, something went wrong".
- [ ] **7.3** Route handler: parse with the same schema, return 400 with the flattened error on failure. On success, hand off to the provider from Step 1 or log and return `{ ok: true }` under the fallback.
- [ ] **7.4** On a 2xx from `/api/capture`, redirect: `window.location.assign(`${link}?prefilled_email=${encodeURIComponent(email)}`)`. Redirect only after the capture resolves — otherwise a visitor who abandons checkout is lost entirely.
- [ ] **7.5** Check three cases by hand and record the result of each: `notanemail` → inline error, no navigation. `a@b.co` → navigates, and the target URL's `prefilled_email` param decodes back to `a@b.co`. Capture route forced to 500 → the user still reaches checkout, with the failure logged. Correct answer: all three behave as written; a broken list provider must never block a sale.

### Step 8: Quality floor

**Produces:** no new files — changes across `Experience.tsx`, `DisplayPanel.tsx`, `globals.css`

**Consumes:** Steps 5–7.

- [ ] **8.1** `prefers-reduced-motion: reduce`: skip the scrub, mount the rig at `seek(1)`, render the five sections as a normal scrolling document, and keep the email step reachable. Verify by toggling the OS setting, not by editing the media query.
- [ ] **8.2** Visible keyboard focus ring on the display input against the dark panel. Tab to it and confirm it is unmistakable.
- [ ] **8.3** `<Suspense>` boundary with a fallback around the rig, and `dpr={[1, 2]}` on the `<Canvas>` to cap retina cost.
- [ ] **8.4** Run Lighthouse mobile. Record the number. Correct answer: performance ≥ 70. Below that, the first lever is `dpr` and the second is texture size — not removing sections.
- [ ] **8.5** Walk all five sections with the console open. Correct answer: zero errors, zero React warnings, zero hydration mismatches. A hydration mismatch here usually means the canvas or a progress value is rendering on the server; guard with a mounted check.

---

## Phase 2 — Baked-clip rig against a vetted model

### Step 9: Baked-clip rig

**Sources:**
- The vetted model selected in Step 0, and `docs/asset-provenance.md`.

**Produces:** `src/three/assembly/baked-clip-rig.ts`

**Consumes:** Step 4 interface, Step 0 verdict, Step 3 dimensions.

- [ ] **9.1** **Gate.** Run this step only if a model passed all four Step 0 gates (0.2 provenance, 0.3 split, 0.4 close-up, and 0.5/0.6 licensing). If no model has passed yet, skip this entire phase and stay on the placeholder rig — Phase 1 is complete and deployable without it. Do not run this step against either rejected Sketchfab asset to "test the pipeline"; Step 4.5's checks already cover the rig, and a rejected asset in `public/` is how it reaches production by accident.
- [ ] **9.2** Implement `createBakedClipRig(gltf): AssemblyRig` where `seek` is `mixer.setTime(progress * clip.duration)`. One clip, scrubbed absolutely. Do not use `play()`, `paused`, or per-part actions.
- [ ] **9.3** Read `displayAnchor` from a node named `DisplayAnchor` in the GLB. If absent, fall back to a hardcoded offset and log a warning naming the missing node — the production model spec requires this node, so the warning is the reminder.
- [ ] **9.4** Check: swapping `createPlaceholderRig()` for `createBakedClipRig()` in `Experience.tsx` is a one-line change and requires no edits to `Overlay.tsx`, `DisplayPanel.tsx`, or `sections.ts`. If it doesn't, the Step 4 interface is leaking and needs fixing before Phase 3.
- [ ] **9.5** Re-run the reversal check from 5.5 and the mobile check from 6.5 against the real geometry. Correct answer: both still pass. Heavier geometry is where scrub stutter first appears.

---

## Phase 3 — Production asset

Two routes. **10a** if a licensed original passed Step 0 but needs part work. **10b** if all candidates failed Step 0.7.

### Step 10a: Split and keyframe a licensed original

**Sources:** the Step 0 model, `SECTIONS` from Step 2, dimensions from Step 3.3.

**Produces:** `public/models/detonator.glb` — five part groups, one animation clip, `DisplayAnchor` node.

- [ ] **10a.1** If the source is a `.blend` with live modifiers, work from that file rather than any export. The modifier stack is the part split already, and flattening it destroys the thing that made this candidate viable.
- [ ] **10a.2** Group meshes into the five `SectionId` sets and rename them to match: `casing`, `charges`, `harness`, `panel`. Separate the display panel out even if it means cutting faces by hand — it needs its own material for the emissive readout.
- [ ] **10a.3** Set each part's origin at its natural pivot (`Object → Set Origin`), not at world centre. A charge block that rotates about the model origin swings through the casing instead of seating onto it.
- [ ] **10a.4** Add an Empty named `DisplayAnchor`, flat on the display surface, parented to the panel. Step 9.3 reads this by name.
- [ ] **10a.5** Keyframe one action: last frame fully seated, first frame scattered outward, staggered to the `SECTIONS` ranges. Scrub the timeline **backwards** before exporting — if it reads correctly in reverse, scroll-up will too.
- [ ] **10a.6** Export glTF 2.0 with animation, modifiers applied, cameras and lights excluded. Check: re-run `fbx_inspect.py` equivalent via `npx @gltf-transform/cli inspect` and confirm five named meshes, one animation, and a `DisplayAnchor` node.

### Step 10b: Commission spec

**Produces:** `docs/model-spec.md` — handed to a 3D artist, not implemented in code.

- [ ] **10b.1** Write the spec as requirements: parts split as separate objects matching the five `SectionId` groups; origins at each part's natural pivot; display panel as its own mesh with its own material; an Empty named `DisplayAnchor` flat on the display surface; 100–150k triangles; 2k PBR textures including an emission map for the display; glTF 2.0 export with modifiers applied, cameras and lights excluded.
- [ ] **10b.2** State the animation requirement: one action, one clip, all parts keyframed on location and rotation, staggered to the `SECTIONS` ranges, last frame fully seated.
- [ ] **10b.3** State the provenance requirement explicitly in the brief: original work only, no decompiled or game-derived geometry, and the delivered file must pass `fbx_inspect.py` with no engine-style internal paths. Attach the script. This is a deliverable condition, not a preference — it is the check that caught two assets already.
- [ ] **10b.4** Give the artist the target dimensions from Step 3.3 and the direction to design toward a generic breaching charge rather than reproduce the CS2 asset. Same visual read, no Valve IP attached to a page that takes payment.
- [ ] **10b.5** Check: hand `docs/model-spec.md` to someone who has not read this plan and ask what they would deliver. If they cannot name the five part groups and the anchor node, the spec is underwritten.

### Step 11: Attribution, optimisation, and deploy

- [ ] **11.1** Drop the final `.glb` into `public/models/`, point `createBakedClipRig` at it.
- [ ] **11.2** If Step 0.5 recorded a required credit string, wire it in now: page footer and repo README, verbatim from `docs/asset-provenance.md`. Under CC BY this is a condition of use, not a courtesy — it is the single easiest line in this plan to forget at deploy and the only one that voids your right to ship.
- [ ] **11.3** Run `npx @gltf-transform/cli optimize` with Draco and texture resize. Record before/after byte size. Correct answer: under 3MB. Above that, reduce textures before geometry — and keep the display panel's own texture at full resolution while dropping the rest, since Section 5 fills the frame with it.
- [ ] **11.4** Confirm `.local/` is absent from `git log --all --name-only`, and that neither rejected Sketchfab asset appears anywhere in history. Correct answer: no matches for `C4-1.fbx`, `w_eq_c4`, or `.local/` in the log.
- [ ] **11.5** Re-run the full Definition of Done list top to bottom on the deployed URL, on a physical phone. Every line, freshly checked — not inferred from Phase 1 passing.

---

## Visual Direction

The subject is a machined field device: olive canvas, oxidised brass, warning-tape amber. Cold, industrial, and specific — not "tech landing page".

**Palette (4–6 tokens, defined once in `globals.css`):**

| Token | Hex | Role |
|---|---|---|
| `--surface` | `#1A1C17` | Page ground — desaturated olive-black, warmer than a neutral dark |
| `--canvas` | `#3F4536` | Olive drab, mid-tone blocks and dividers |
| `--brass` | `#8A6E3B` | Oxidised metal, rules and borders |
| `--amber` | `#C8862A` | Warning accent — scroll cue, section markers |
| `--paper` | `#D8D4C6` | Body text, slightly warm off-white |
| `--armed` | `#4EE27B` | Display green — **section 5 only, nowhere else** |

The green is the whole point of its scarcity. If it appears in a heading, a hover state, or a scroll indicator, section 5 stops being a payoff. One accessory, worn once.

**Type:** Archivo Expanded 700 for headings, Archivo 400 for body — one family, two widths, so the pairing is a decision rather than a default serif-plus-sans. DSEG7 Classic for the readout only.

Avoid: all-caps eyebrow labels, single-word colour accents inside headings, `→` glyphs appended to buttons.

**Numbered markers are legitimate here.** The five sections are a genuine assembly sequence, so "Stage one … Stage five" encodes real information rather than decorating. Set them in amber at small size, left-aligned above each heading.

**Layout:** copy pinned left at roughly 34ch, vertically centred, device holding the right two-thirds on desktop. On mobile the device sits behind the copy at reduced opacity rather than stacking — stacking halves both.

**Motion:** the scroll scrub is the one orchestrated moment on the page. No fade-and-slide-up on section entry, no hover transitions on anything. The assembly is the motion budget, spent entirely.

---

## Self-Review

Checked against the brief:

- Five sections → Step 2 defines them, Step 5.3 renders them. ✓
- Parts assemble on scroll → Steps 4 and 5. ✓
- Reverses on scroll up → 5.5, re-checked at 9.5. ✓
- Email input on the green display → Step 6, with the mobile fallback at 6.6. ✓
- Confirm then redirect to payment → Step 7. ✓
- Ready-made rig, model swapped in later → the Step 4 interface; verified as a one-line change at 9.4. ✓
- Placeholder testable before any asset exists → Steps 4–8 need no model at all, and the Step 0 fallback says so explicitly. ✓
- Rejected assets kept out of the shipped artefact → 3.1, 9.1, 11.4. ✓
- No asset ships on a listing's word alone → Step 0.2 is the gate, and it overrides the license field by construction. ✓
- Attribution honoured where required → 0.5, 11.2, and a Definition of Done line. ✓
- Blocked-on-user items at the top → Steps 0 and 1. ✓

Name consistency checked: `docs/asset-provenance.md` is created at 0.1 and read at 3.3, 9.1, and 11.2 under that same name. The old `.local/asset-report.md` is gone; no step references it.

Gaps left open deliberately: no step verifies conversion or writes analytics, because analytics is out of scope per Constraints. And Phase 3 cannot be fully specified until Step 0 resolves, since 10a and 10b are mutually exclusive — that is a real branch, not a placeholder, and both branches are written out in full.
