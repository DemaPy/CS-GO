# Light studio redesign — design

**Date:** 2026-09-27
**Status:** approved in conversation, revised after statement verification
(`2026-09-27-light-studio-redesign-verification.md`), awaiting written-spec
review
**Sub-project:** 1 of 3 (redesign → domain + Resend → analytics/UTM + go-live)

References like **(A34)** point to rows in the verification table.

## Why

The site is a demand test. Traffic arrives from social media posts carrying UTM
parameters. The signal that counts is a visitor who submits an email on the
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

### Open decisions for the user

1. **Email button colour.** It was approved as `#111` in chat. Verification
   found no evidence that dark survives dark-mode inversion better (D6). In
   partial-invert clients (Outlook apps), the white card goes dark while a
   `#111` button stays put and loses its edge. The spec now defaults to a
   `#C73E00` button with white text (5.1:1), which partial inversion leaves
   visible. Confirm, or keep `#111`.
2. **Licence chain of the device model.** The model is "C4 bomb | CS2" (D5), a
   fan model of a Valve Counter-Strike 2 asset. The uploader's CC BY grant
   cannot license Valve's underlying design. This affects the whole page, not
   just the OG card. The redesign itself is unaffected (the model is behind an
   env switch), but it has to be settled before paid or organic promotion.
3. **OG card image.** Keep the device render, or go typographic-only? The
   evidence (D7): Meta's weapons policy governs **ads** and allows game and
   fiction contexts, and there's no evidence of organic preview suppression.
   Organic IG/TikTok posts don't show OG cards at all; X, Facebook and
   messaging apps do.

## 1. Visual system

### Tokens

Replace the palette in `src/app/globals.css`. Nothing outside these tokens may
introduce a colour, except the device itself and the LCD.

| Token | Value | Use | Contrast on `--ground` |
|---|---|---|---|
| `--ground` | `#F5F5F2` | page background | — |
| `--ink` | `#111111` | headings, primary text | 17.29:1 (B1) |
| `--muted` | `#6B6B6B` | body copy, stage label, credits | 4.88:1, AA (B2) |
| `--rule` | `#E2E2DD` | hairlines, mobile divider | decorative |
| `--signal` | `#FF4F00` | **fills only**: tick marks, focus ring | 3.02:1, non-text only (B3) |
| `--signal-ink` | `#C73E00` | orange **text**, links, email button | 4.67:1, AA (B4) |
| `--armed` | `#4EE27B` | LCD readout only, unchanged | n/a (on dark LCD) |

`--signal` fails AA for text, so any orange text uses `--signal-ink`. This is a
hard rule. `--signal` clears 3:1 by only 0.02, so it may not be lightened.

The `@theme inline` block is renamed to match (`surface/canvas/brass/amber/
paper` → `ground/ink/muted/rule/signal/signal-ink/armed`), and every usage is
migrated. The old names are removed rather than aliased. Tailwind v4 silently
emits nothing for an unknown class (C3), so completeness is checked by the
greps in §5, not by the compiler.

The "device is dark in every context, no light mode" comment in `globals.css`
is replaced: the page is light-only. There is no dark-mode variant, because the
page is a single art-directed scene, not an app theme.

### Type

- **Geist** and **Geist Mono** via `next/font/google` (`Geist`, `Geist_Mono`,
  C4), `display: swap`. Archivo and its `wdth` axis are removed from
  `layout.tsx`.
- `.h-display` is rewritten: Geist 600, `letter-spacing: -0.035em`,
  `line-height: 1.02`, `text-wrap: balance`, no `font-stretch`.

| Role | Spec |
|---|---|
| Stage label | Geist Mono 12px, uppercase, `+0.08em` tracking, `--muted`. Renders `01 / 05 · CASING`, with the `01 / 05` part in `--signal-ink`. Built from the section index and `id`. The `eyebrow` strings stay in `sections.ts` but are no longer rendered on the landing page |
| Heading | `clamp(2.25rem, 8vw, 4rem)`, `--ink` |
| Body | Geist 400, 17px mobile / 18px ≥768px, `line-height: 1.55`, `--muted`, `max-w-[34ch]` |
| Credits | Geist Mono 10px, `--muted`, links underlined in `--rule`, hover `--ink` |
| LCD readout | DSEG14, unchanged |

Focus ring: `2px solid var(--signal)`, `outline-offset: 3px`, still global.
Reduced-motion rules unchanged.

## 2. Layout

### Desktop (≥768px)

The composition is unchanged: copy column left, vertically centred,
`max-w-[34ch]`; device in the right two-thirds via `baseTarget(desktop)`
(measured at 49.6–84.3% of the width at 1440×900); section 5's copy pinned
above the lit panel. Gutters: 24 / 40 / 64px at base / `sm` / `lg`. The credits
line uses the copy column's left gutter.

### Mobile (<768px), designed first

- **The device renders at full strength in the top ~58% of the viewport.** The
  canvas stays full-screen, because drei's `<Scroll html>` overlay is appended
  to the Canvas container (A8). Moving the device into the band takes two
  things, both computed per frame from the viewport:
  1. **A mobile camera distance.** At today's fixed distance of 550 the device
     fills 74% of the height and 117% of the width on a 390×844 phone (B11).
     So the base distance on mobile is the larger of the width fit and the
     height fit, for the assembled device box (179.44 × 253.80 mm, A41):
     ~88% of the width, and ~52% of the height (the band minus margin).
  2. **A vertical shift.** The camera and its look target both move down by
     the same world amount, `Δy = 0.42 · dist · tan(fov/2)` (B6), so the
     device centre lands at ~29% of the height. The view stays square to the
     axis.

  **Not `camera.setViewOffset`.** In transform mode, drei's `Html` builds its
  CSS projection from `projectionMatrix.elements[5]` alone and ignores the
  off-axis terms (C1), so the LCD would move while the typed-input overlay
  stayed put. Camera translation is tracked correctly, because `Html` uses
  `matrixWorldInverse` (C2).

  Mobile dimming is deleted in **both** places: `.dim-device` (A5) and the
  reduced-motion wrapper's `opacity-30 md:opacity-100` (A43).
- **Copy sits in a bottom band.** Each `<section>` aligns its copy block to the
  bottom (`items-end`), with bottom padding = credits height +
  `env(safe-area-inset-bottom)` + 24px. Behind the band: a 1px `--rule` top
  hairline and a `--ground` gradient from transparent to ~92% opacity, so a
  part passing behind the text mid-flight never costs legibility.
- **Stage 5 on mobile:** the camera push places the LCD in the top band (the
  vertical shift still applies during the push), and "Arm it" plus the body
  line sit in the bottom band, not pinned to the top. `pinStageFive` keeps
  working for desktop; on mobile the block pins to the bottom band instead.
  When the on-screen keyboard opens it covers the copy band, and the LCD input
  stays visible.
- **The stage 5 body line is restored** on both breakpoints. `Overlay` skips it
  when `isLast` (A9), so the visitor is never told what the input is for.
- **Tap targets:** the ARM button on the LCD gets a hit area of at least
  44×44 CSS px, measured on screen at full push. The LCD is a drei
  `<Html transform>` element, so its own CSS size is scaled. 44 is the WCAG
  AAA / Apple HIG size; AA requires only 24 (D3).

### In-app browser hardening

- **`100svh` instead of `100vh`** for the sections, the `<main>` scroll host,
  and `pt-[7vh]` → `pt-[7svh]` (A11). The reason: `vh` is the *large*
  viewport, so while toolbars are visible the bottom of a `100vh` box sits
  under them. That would hide the bottom copy band. `svh` is the small
  viewport and always fits the visible area. Both units are static. Neither
  one resizes the canvas as toolbars move, and the page scrolls inside drei's
  nested div, so the toolbars may never collapse at all (D1). Tailwind 4.3.3
  provides `h-svh` / `min-h-svh`.
- `viewport: { viewportFit: 'cover' }` in the root layout, and safe-area insets
  on the credits line and copy band (C12).
- **Keyboard stability is done in code, not a meta tag.** Android in-app
  webviews are sized by the host app, and `interactive-widget` does not reach
  them; Chrome itself already defaults to `resizes-visual` (D2). If the webview
  resizes, R3F resizes the canvas (C18). ScrollControls keeps `scrollTop` in
  px, so the offset jumps on the next scroll event, e.g. to ~0.59 at stage 5
  (C17), and the display goes dark. So while the LCD input is focused:
  - the scrub freezes: `frame()` uses the progress captured at focus, not
    `scroll.offset`;
  - on blur, `scrollTop` is restored to the same fraction of the new scroll
    length before the scrub resumes.
- Credits live in the bottom safe-area strip at 10px mono. The copy band's
  padding reserves their height, so the two never overlap.

### Reduced motion

The same split applies on mobile: the assembled device at the top at full
strength, the sections scrolling as a normal document underneath.

## 3. The 3D scene

- **Lighting (`Lighting` in `Experience.tsx`).** Remove the olive ambient
  (`#cfd3c0`) and the brass bounce (A13). Replace with:
  - drei `<Environment>` whose only children are `<Lightformer>`s (a key panel
    above-right, a fill panel left). With no `files`/`preset` it downloads
    nothing (C13). Its cube camera's `far` is 1000, so every Lightformer sits
    within 1000 mm of the origin, or `far` is passed explicitly;
  - one directional key light kept for form definition.
  Intensities are tuned by eye against screenshots, on the real model.
- **Grounding shadow: drei `<ContactShadows>` as a back wall.** It projects
  orthographically along its plane normal. The shadow camera looks along the
  group's local −z (C14), and a user `rotation` replaces drei's default floor
  orientation (C15). So:
  - `rotation={[0, Math.PI, 0]}` makes it project along world +z, toward the
    camera. Mirroring gets checked on the first screenshot;
  - opacity follows `1 − depth/far` (C19), so the plane has to sit **close**
    behind the device, or the assembled halo is invisible. At z −220 with
    `far` 260 the peak was ~0.09;
  - **position, `far` and `scale` are chosen by the geometry script** (the one
    used for verification, which replicates `seek` and `frame`). They must
    meet three criteria at 360×780, 390×844, 768×1024, 1440×900, 1680×720
    and 1920×1080:
    1. no in-frame vertex lies behind the plane at any progress;
    2. the assembled device's peak shadow alpha, before opacity, is ≥ 0.5;
    3. every in-frame vertex's projection falls inside the plane. `scale` 520
       failed at 1920×1080 and 1680×720 (B10).
  - `blur` ~2.5 and `resolution` 256 are the starting point, then tuned;
  - `frames` is **not** left at the default `Infinity`, which re-renders the
    whole scene with an override material every frame (C19). The shadow
    re-renders only while scroll progress is changing.
- **Placeholder colours (`PART_COLOR` in `types.ts`).** Graphite casing,
  aluminium-grey charges, `--signal` harness, near-black panel, graphite arm.
  This mainly affects the placeholder rig. On the real model, `paint()`
  skips textured materials (A42), so only the untextured LCD-plane material
  takes `PART_COLOR.panel`, and that stays near-black. The palette comment is
  updated to say so.
- **LCD status/error text.** It is `text-amber` today, but it renders green:
  the unlayered `.readout` colour beats `@layer utilities` (A17). This is an
  existing bug. The fix is an unlayered `.readout-alert { color: #FF4F00 }`
  rule defined after `.readout` in `globals.css` (5.87:1 on `#0b0f08`, B5),
  not another utility class.
- **Mobile performance.** `dpr` becomes `[1, 1.75]` below 768px and stays
  `[1, 2]` above (A18). If mobile Lighthouse performance is below 70 (A19),
  the live `ContactShadows` on mobile is replaced by a static, pre-blurred
  shadow image under the assembled device.

## 4. Other surfaces

### `/subscribed`

Same tokens and type. The stage-label style shows the state (`CONFIRMED`,
`LINK EXPIRED`, `LINK NOT VALID`) in mono, with a `--signal` tick. Then the
Geist 600 heading and the muted body. On mobile the block sits in the bottom
band, matching the landing page. `min-h-screen` → `min-h-svh` (A20). The back
link uses `--signal-ink` with an underline and a 44px tap target. No 3D. The
copy and the three states are unchanged (A21).

### Confirmation email (`src/emails/confirm-address.tsx`)

The `COLORS` table (A22) becomes light: `#F5F5F2` body, a white 520px card
(the existing container width) with a `#E2E2DD` border, an `#111111` heading
and a `#6B6B6B` body. The button is `#C73E00` with white text; see Open
decision 1. One small dark readout strip is kept (`ADDRESS · PENDING`, green
monospace on `#0b0f08`) as the single echo of the device. In full-invert
clients (Gmail iOS, Outlook Windows) the strip may flip to light, which is
accepted (D6). The existing constraints hold, as verified in A23: inline styles
only, no webfonts, no images, single column. The header comment is updated to
describe the new direction.

### Title, meta, OG

Read the metadata docs in
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/`
before writing this code (per `AGENTS.md`).

- Root `metadata.title` becomes `{ default: <current title>, template: '%s · <current title>' }`
  (C9). The name stays the existing `TODO(copy)` placeholder. This changes
  `/subscribed`'s rendered tab title to "Address confirmed · Five stages to
  armed". That's a formatting change, not a copy change.
- **`metadataBase` is conditional**:
  `metadataBase: process.env.CAPTURE_SITE_URL ? new URL(process.env.CAPTURE_SITE_URL) : undefined`.
  With it unset, Next already falls back to `VERCEL_PROJECT_PRODUCTION_URL` in
  production. The earlier `?? 'http://localhost:3000'` would have overridden
  that and shipped localhost OG URLs with no warning (C10). The ternary also
  avoids `new URL('')` throwing on an empty-but-set variable.
- `themeColor: '#F5F5F2'` via the `viewport` export (C11).
- `src/app/opengraph-image.tsx`, using `next/og` `ImageResponse` (C7) at
  1200×630: the `--ground` background, the landing heading in Geist 600,
  `01 / 05` in `--signal-ink`, and on the right a static PNG of the assembled
  device (see Open decision 3). The PNG is captured once from the real scene
  on the light ground and committed at `public/og/device.png`.
- `src/app/twitter-image.tsx` is a **named** re-export:
  `export { default, alt, size, contentType } from './opengraph-image'`.
  `export *` drops `default` (C8).
- **Fonts for the renderer.** Satori accepts TTF/OTF/WOFF, not WOFF2 (C6), and
  `next/font/google` exposes no file path (C5). So `Geist-SemiBold.ttf` and
  `GeistMono-Regular.ttf` from `vercel/geist-font` v1.7.2
  (`fonts/Geist/ttf/`, `fonts/GeistMono/ttf/`, SIL OFL 1.1, D4) are committed
  under `src/app/og-fonts/`, with `OFL.txt` beside them, and read with
  `readFile`.
- **Size budget.** `next/og` has a 500 KB bundle limit, and the two full TTFs
  plus the PNG come to ~427 KB (C20). The TTFs are subset to Basic Latin
  (`pyftsubset`, same licence), and the PNG is kept ≤ 120 KB.
- **Attribution.** The OG PNG is a render of CC BY material, so it carries a
  small credit line in the corner, per `credits.ts` (D5). The credit, on the
  card, the page and in the README, also gets the modification notice CC BY
  §3(a)(1)(B) requires, e.g. "modified: regrouped for animation". `credits.ts`
  currently has no such notice and `href: null` (A26).

## 5. Verification

Done means all of the following, with evidence:

1. `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build` pass, **and** both
   greps return nothing:
   - `grep -rnE '(text|bg|border|decoration|outline|ring|fill|stroke|divide|shadow|accent|caret|placeholder|from|to|via)-(surface|canvas|brass|amber|paper)\b' src`
   - `grep -rnE -- '--(surface|canvas|brass|amber|paper)\b' src` (catches
     `var(--brass)` and arbitrary values; the leading `--` keeps `<Canvas>`
     from matching)

   Also search `src` by eye for leftover `amber-500`-style default-palette
   classes, which still compile (C3).
2. Chrome DevTools screenshots at 390×844, 360×780, 768×1024 and 1440×900,
   each at scroll progress 0, 0.3, 0.5, 0.7, 0.9 and 1.0, plus reduced motion
   at 390 and 1440. I review them myself and show the user the key frames.
3. Contrast is checked on the rendered page (DevTools), not only in the token
   table. The LCD alert text must compute to `#FF4F00`, not green (A17).
4. Mobile Lighthouse performance ≥ 70; otherwise apply the shadow fallback and
   re-measure.
5. The ContactShadows geometry criteria in §3 pass in the geometry script.
6. The email is rendered to HTML locally and screenshotted. A real-inbox check
   waits for sub-project 2.
7. `/opengraph-image` and `/twitter-image` render correctly in the browser; the
   built HTML carries `og:image` and `twitter:image`; the route is within the
   500 KB limit. A share-preview check happens after deploy (sub-project 3).
8. **Keyboard freeze:** in DevTools mobile emulation, focus the LCD input,
   resize the viewport height by −300px, and confirm the display stays lit and
   progress is unchanged. On blur, progress is restored.
9. **Deferred to sub-project 3:** the user's own phone plus the Instagram
   in-app browser against the deployed URL, including typing into the LCD with
   the keyboard open.

## Phase B — 3D fixes (after Phase A is signed off)

From the 2026-09-27 screenshot review, with the corrected diagnoses:

1. **Stage 1 opens empty.** At progress 0 every mover is out of frame at every
   tested viewport (A29). The casing starts 420 mm below its seat, and its top
   edge ends ~95 mm below the frustum. The casing must be on screen at
   progress 0.
2. **Tape and wires seat in the wrong stage.** `build_device_glb.py` sends
   everything grey below `BRICK_TOP_Z` to `casing` (A30). That includes the
   tape **and the red and black wire runs**, which never reach the saturation
   test, so the `s > 0.50` threshold is not the cause (A32). Meanwhile the
   yellow wire has a hue of ~53, passes the tan-brick test, and flies in with
   brick 3 (A33). The fix is in the slab-branch classification: tape into its
   own post-charges group, and all three wires into `harness`.
3. **The LCD overlay is offset** (A34). `DisplayAnchor` is centred on the
   LCD-plane mesh (x 17.12) rather than the textured glass (x 11.4), and the
   shell (87.6 × 28.3) is larger than the glass (84.2 × 17.3).
   `PANEL_WIDTH`/`PANEL_HEIGHT` are not the cause: they measure the DOM shell
   exactly (A35). The fix: move the anchor to the glass centre, and size the
   shell to the glass.
4. **`REFERENCE_BOUNDS` is stale** (A41): 165.5×250×81.4 against the real
   179.44×253.80×78.83. Update it and re-check desktop framing, since
   `baseTarget` reads `B.x`.
5. **"Four charges"** vs three bricks (A36). This is a copy fact, not style.
   Flag it to the user; don't rewrite it silently.

Each fix gets its own before/after screenshot at the relevant progress.

## Parked for later sub-projects (not designed here)

- **Sub-project 2 (domain + Resend):**
  - Audit the confirm flow. The token is HMAC-signed, expires in 7 days and is
    compared timing-safe, but it is **not purpose-bound and not single-use**
    (A40). Decide whether that matters for demand counting: replaying a link
    re-confirms the same address, so count unique addresses.
  - Reject disposable email domains at `/api/capture`, server-side, in the Zod
    schema both sides already share (A37).
  - Verify the sending domain in Resend, set `CAPTURE_FROM_EMAIL` and
    `CAPTURE_SITE_URL`, and run a real-inbox test.
- **Sub-project 3 (analytics + go-live):**
  - Analytics with UTM attribution, funnel landed → stage 5 → submitted →
    confirmed, per source and campaign.
  - Domain purchase (Namecheap, the user buys it) and DNS to Vercel; Vercel
    project and env.
  - **The model is committed** (A38). It only fails to ship because
    `NEXT_PUBLIC_USE_DEV_MODEL` defaults to off in production, so set it in the
    production env. Fix the stale "gitignored" comments in `device-model.ts`
    and the `build_device_glb.py` docstring.
  - Texture compression for the 2.4 MB GLB.
  - Real-phone and in-app browser test.
