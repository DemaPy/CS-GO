# Light studio redesign — design

**Date:** 2026-09-27
**Status:** approved in conversation, awaiting written-spec review
**Sub-project:** 1 of 3 (redesign → domain + Resend → analytics/UTM + go-live)

## Why

The site is a demand test. Traffic arrives from social media posts carrying UTM
parameters, and the signal that counts is a visitor who submits an email on the
device display **and confirms it** via the double opt-in link. Most of that
traffic opens the link inside a phone's in-app browser (Instagram, TikTok, X),
so the page is designed mobile-first.

The current look (olive-black ground, brass, warning amber, Archivo at 125%
width) reads as military kit. The goal is a clean, product-shot presentation:
the device lit on a light studio ground.

**In scope:** landing page colours, type and layout; the 3D scene's lighting and
grounding; `/subscribed`; the confirmation email; title, meta and OG image.
Then, as Phase B, the 3D bugs found in the 2026-09-27 screenshot review.

**Out of scope:** copy (all strings in `src/content/sections.ts` and the
`TODO(copy)` title stay as they are), Paddle (stays unconfigured), analytics,
domain, deploy.

## Decisions

| Question | Decision |
|---|---|
| Direction | Light studio: off-white ground, near-black type, one accent |
| Type | Geist + Geist Mono, Swiss-grotesk treatment |
| Accent | Signal orange |
| Mobile layout | Device in the top ~58%, copy in a bottom band |
| Extra surfaces | `/subscribed`, confirmation email, title/meta/OG |
| 3D fixes | Yes, after the redesign (Phase B) |

## 1. Visual system

### Tokens

Replace the palette in `src/app/globals.css`. Nothing outside these tokens may
introduce a colour, except the device itself and the LCD.

| Token | Value | Use | Contrast on `--ground` |
|---|---|---|---|
| `--ground` | `#F5F5F2` | page background | — |
| `--ink` | `#111111` | headings, primary text | 17.3:1 |
| `--muted` | `#6B6B6B` | body copy, stage label, credits | 4.9:1 (AA) |
| `--rule` | `#E2E2DD` | hairlines, mobile divider | decorative |
| `--signal` | `#FF4F00` | **fills only**: tick marks, focus ring | 3.0:1 (non-text only) |
| `--signal-ink` | `#C73E00` | orange **text** and links | 4.7:1 (AA) |
| `--armed` | `#4EE27B` | LCD readout only, unchanged | n/a (on dark LCD) |

`--signal` fails AA for text at 3.0:1, so any orange text uses `--signal-ink`.
This is a hard rule, not a preference.

The Tailwind `@theme inline` block is renamed to match (`surface/canvas/brass/
amber/paper` → `ground/ink/muted/rule/signal/signal-ink/armed`), and every
usage is migrated. The old names are removed rather than aliased, so a missed
usage fails the build instead of rendering olive.

The "device is dark in every context, no light mode" comment in `globals.css`
is replaced: the page is now light-only. There is still no dark-mode variant,
because the page is a single art-directed scene, not an app theme.

### Type

- **Geist** (sans) and **Geist Mono**, both via `next/font/google`, `display: swap`.
  Archivo and its `wdth` axis are removed from `layout.tsx`.
- `.h-display` is rewritten: Geist 600, `letter-spacing: -0.035em`,
  `line-height: 1.02`, `text-wrap: balance`, no `font-stretch`.

| Role | Spec |
|---|---|
| Stage label | Geist Mono 12px, uppercase, `+0.08em` tracking, `--muted`. Renders `01 / 05 · CASING`, with the `01 / 05` part in `--signal-ink`. Built from the section index and `id`; `eyebrow` strings remain in `sections.ts` but are no longer rendered on the landing page. |
| Heading | `clamp(2.25rem, 8vw, 4rem)`, `--ink` |
| Body | Geist 400, 17px mobile / 18px ≥768px, `line-height: 1.55`, `--muted`, `max-w-[34ch]` |
| Credits | Geist Mono 10px, `--muted`, links underlined in `--rule`, hover `--ink` |
| LCD readout | DSEG14, unchanged |

Focus ring: `2px solid var(--signal)`, `outline-offset: 3px`, still global.
Reduced-motion rules unchanged.

## 2. Layout

### Desktop (≥768px)

Unchanged composition: copy column left, vertically centred, `max-w-[34ch]`;
device in the right two-thirds via the existing `baseTarget(desktop)` offset;
section 5's copy pinned above the lit panel. Gutters: 24 / 40 / 64px at
base / `sm` / `lg`. The credits line uses the same left gutter as the copy
column.

### Mobile (<768px), designed first

- **The device renders at full strength in the top ~58% of the viewport.** The
  canvas stays full-screen (drei's `<Scroll html>` overlay must share its
  container). The frame is shifted with `camera.setViewOffset` so that the
  device's centre lands at ~29% of viewport height. The camera target on mobile
  stays at the device centre (as today). `.dim-device` and its 35% opacity are
  deleted.
- **Copy sits in a bottom band.** Each `<section>` aligns its copy block to the
  bottom (`items-end`), with bottom padding = credits height +
  `env(safe-area-inset-bottom)` + 24px. Behind the band: a 1px `--rule` top
  hairline and a `--ground` gradient from transparent to ~92% opacity, so a
  part passing behind the text mid-flight never costs legibility.
- **Stage 5 on mobile:** the camera push places the LCD in the top band (the
  view offset still applies during the push), and "Arm it" plus the body line
  sit in the bottom band, not pinned to the top. `pinStageFive` keeps working
  for desktop; on mobile the block pins to the bottom band instead. When the
  on-screen keyboard opens it covers the copy band, and the LCD input stays
  visible.
- **Tap targets:** the ARM button on the LCD gets a hit area of at least
  44×44 CSS px (padding / pseudo-element), with no visual size change.
  Scaling note: the LCD is a drei `<Html transform>` element, so 44px is
  measured on screen at full push, not in the element's own CSS.

### In-app browser hardening

- `100vh`/`h-screen` → `100svh` for the sections and the `<main>` scroll host.
  In-app toolbars collapse on scroll; `vh` resizes the canvas mid-scrub, which
  shows up as a stutter.
- `viewport: { viewportFit: 'cover' }` in the root layout, and safe-area insets
  on the credits line and copy band.
- Credits live in the bottom safe-area strip at 10px mono. The copy band's
  padding reserves their height, so the two never overlap.

### Reduced motion

The same split applies on mobile: the assembled device at the top, the sections
scrolling as a normal document underneath.

## 3. The 3D scene

- **Lighting (`Lighting` in `Experience.tsx`).** Remove the olive ambient
  (`#cfd3c0`) and the brass bounce. Replace with:
  - a drei `<Environment>` built from `<Lightformer>` children (a key panel
    above-right, a fill panel left). It renders locally, with **no HDR
    download** from a CDN;
  - one directional key light kept for form definition.
  Intensities are tuned by eye against screenshots, on the real model.
- **Grounding shadow.** drei `<ContactShadows>` on a plane behind the device,
  facing the camera: opacity ~0.3, blur ~2.5, resolution 256. The shadow falls
  down-right, consistent with the key.
- **Placeholder colours (`PART_COLOR` in `types.ts`).** Graphite casing,
  aluminium-grey charges, `--signal` harness, near-black panel, graphite arm.
  The comment explaining the palette is updated.
- **LCD overlay (`DisplayPanel.tsx`).** The shell stays dark. Status and error
  text moves from `text-amber` to `#FF4F00` (~6:1 on `#0b0f08`).
- **Mobile performance.** `dpr` becomes `[1, 1.75]` below 768px and stays
  `[1, 2]` above. If mobile Lighthouse performance is below 70 (the plan's
  existing floor), the live `ContactShadows` is replaced on mobile by a static,
  pre-blurred shadow image under the assembled device.

## 4. Other surfaces

### `/subscribed`

Same tokens and type. The stage-label style shows the state (`CONFIRMED`,
`LINK EXPIRED`, `LINK NOT VALID`) in mono, with a `--signal` tick. Then the
Geist 600 heading and the muted body. On mobile the block sits in the bottom
band, matching the landing page. `min-h-screen` → `min-h-svh`. The back link
uses `--signal-ink` with an underline and a 44px tap target. No 3D. The copy
and the three states are unchanged.

### Confirmation email (`src/emails/confirm-address.tsx`)

The `COLORS` table becomes light: `#F5F5F2` body, a white 560px card with a
`#E2E2DD` border, an `#111111` heading, and a `#6B6B6B` body. The button is a
solid `#111111` fill with white text; it survives dark-mode colour inversion
better than a saturated fill. One small dark readout strip is kept
(`ADDRESS · PENDING`, green monospace on `#0b0f08`) as the single echo of the
device. The existing email constraints hold: inline styles only, no webfonts,
no images, single column. The header comment is updated to describe the new
direction.

### Title, meta, OG

- Root `metadata.title` becomes `{ default: <current title>, template: '%s · <current title>' }`.
  The name stays the existing `TODO(copy)` placeholder.
- `metadataBase: new URL(process.env.CAPTURE_SITE_URL ?? 'http://localhost:3000')`,
  so OG URLs are absolute once the domain exists.
- `themeColor: '#F5F5F2'` via the `viewport` export.
- `src/app/opengraph-image.tsx` (and `twitter-image.tsx` re-exporting it),
  using `next/og` `ImageResponse`, 1200×630: the `--ground` background, the
  landing heading in Geist 600, `01 / 05` in `--signal-ink`, and on the right a
  static PNG of the assembled device. The PNG is captured once from the real
  scene on the light ground and committed at `public/og/device.png`
  (≈150 KB). Geist font data is read from the file system for the image
  renderer.

  The OG PNG derives from the CC-BY model, so the attribution requirement also
  applies to it. The card carries a small credit line in the corner, per
  `src/content/credits.ts`.

Before writing this code, read the metadata docs in
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/`
(per `AGENTS.md`: this Next.js version differs from training data).

## 5. Verification

Done means all of the following, with evidence:

1. `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build` pass.
2. Chrome DevTools screenshots at 390×844, 360×780, 768×1024 and 1440×900,
   each at scroll progress 0, 0.3, 0.5, 0.7, 0.9 and 1.0, plus reduced motion
   at 390 and 1440. I review them myself and show the user the key frames.
3. Contrast is checked on the rendered page (DevTools), not only in the token
   table.
4. Mobile Lighthouse performance ≥ 70; otherwise apply the shadow fallback and
   re-measure.
5. The email is rendered to HTML locally and screenshotted. A real-inbox check
   waits for sub-project 2.
6. `/opengraph-image` renders correctly in the browser. A share-preview check
   happens after deploy (sub-project 3).
7. **Deferred to sub-project 3:** the user's own phone plus the Instagram
   in-app browser against the deployed URL, including typing into the LCD with
   the keyboard open.

## Phase B — 3D fixes (after Phase A is signed off)

From the 2026-09-27 screenshot review:

1. **Stage 1 opens empty.** `SCATTER.casing` starts the casing 420 mm below
   frame, so progress 0 shows nothing. The casing must be on screen at
   progress 0.
2. **The tape floats at stage 2.** `build_device_glb.py` classifies grey parts
   below `BRICK_TOP_Z` as `casing`, so the tape strapping seats before the
   bricks it wraps. Also check why the red/black cable runs seat at stage 2
   rather than with `harness` (the `s > 0.50` saturation test misses the black
   wire).
3. **The LCD overlay is offset** from the model's LCD (screenshot 5).
   `PANEL_WIDTH`/`PANEL_HEIGHT` were measured on the placeholder rig. Re-measure
   against the glTF LCD, and check the `DisplayAnchor` position.
4. **Stage 5's instruction line is missing.** `Overlay` hides the body when
   `isLast`, so the visitor is never told what the input is for.
5. **"Four charges"** vs three bricks. This is a copy fact, not style. Flag it
   to the user; don't rewrite it silently.

Each fix gets its own before/after screenshot at the relevant progress.

## Parked for later sub-projects (not designed here)

- **Sub-project 2 (domain + Resend):** audit `/api/confirm` and
  `consent-token.ts` (signed, expiring, single-purpose token); reject
  disposable email domains at `/api/capture` (server-side, same Zod schema as
  the client); verify the sending domain in Resend; set `CAPTURE_FROM_EMAIL`
  and `CAPTURE_SITE_URL`; real-inbox test of the email.
- **Sub-project 3 (analytics + go-live):** analytics with UTM attribution,
  funnel landed → stage 5 → submitted → confirmed, per source/campaign;
  domain purchase (Namecheap, user buys) and DNS to Vercel; Vercel project +
  env; **the model is gitignored, so a git deploy ships the placeholder**, and
  the model needs a deploy path; texture compression for the 2.4 MB GLB;
  real-phone and in-app browser test.
