# Statement verification — light studio redesign spec

Source: `docs/superpowers/specs/2026-09-27-light-studio-redesign-design.md` at
commit e7ab92d (before the corrections this table prompted).

Every factual statement in that spec, one per row. **T/F** column:

- **T**: true.
- **T\***: true with a caveat, given in the evidence column.
- **F**: false.
- **?**: judgment or undeterminable.

Evidence cites a file:line, a command and its output, or a URL.

Verified 2026-09-27 by two agents working in parallel: codebase + arithmetic
(A, B), and library + platform (C, D). Geometry comes from parsing
`public/models/c4-device.glb` and replicating `createGltfRig`/`seek`/`frame()`
in three 0.185.1. Library claims were checked against the installed packages:
next 16.3.4, drei 10.7.8, R3F 9.7.0, tailwindcss 4.3.3, @vercel/og 0.11.1.
Throwaway scripts live in the session scratchpad.

**Totals: 81 statements (75 explicit + 6 implicit, marked *(implicit)*). 52 T, 13 T\*, 13 F, 3 ?.**

## A. Current codebase facts

| # | Statement | § | T/F | Evidence |
|---|---|---|---|---|
| A1 | The current palette is olive-black ground, brass, warning amber | Why | T | `globals.css:6` `--surface #1a1c17`, `:8` `--brass #8a6e3b`, `:9` `--amber #c8862a` |
| A2 | Headings currently use Archivo at 125% width | Why | T | `globals.css:45` `font-stretch: 125%`; `layout.tsx:8-13` Archivo `axes: ['wdth']` |
| A3 | `@theme inline` uses surface/canvas/brass/amber/paper (plus armed) | §1 | T | `globals.css:14-23` (plus `--font-sans`, `--font-seven`) |
| A4 | `globals.css` has a "device is dark in every context, no light mode" comment | §1 | T | `globals.css:25-26` |
| A5 | `.dim-device` dims the canvas to 35% on mobile | §2 | T | `globals.css:80-82`; applied at `Experience.tsx:385` when `!desktop` |
| A6 | Desktop framing uses `baseTarget(desktop)` | §2 | T | `Experience.tsx:68-70` `x = desktop ? -B.x*0.55 : 0` |
| A7 | Section 5 copy is pinned above the panel on desktop via `pinStageFive` | §2 | T | `Experience.tsx:210-230`; `Overlay.tsx:31` `isLast ? 'items-start pt-[7vh]'` |
| A8 | drei's `<Scroll html>` overlay must share the Canvas container | §2 | T | drei `web/ScrollControls.js:35` `target = gl.domElement.parentNode`, `:90` `target.appendChild(el)`, `:205` ScrollHtml renders into `state.fixed` inside `el` |
| A9 | `Overlay` skips the body line when `isLast` | §2 | T | `Overlay.tsx:59-63` |
| A10 | `DISPLAY_LIVE_AT` is 0.85 | §2 | T | `sections.ts:56` |
| A11 | Sections and main use `h-screen` (vh) today | §2 | T | `Experience.tsx:375` `<main className="h-screen w-screen">`; `Overlay.tsx:25` sections `h-screen`. Also `Overlay.tsx:31` `pt-[7vh]`, which the spec did not mention |
| A12 | `eyebrow` strings exist in `sections.ts` | §1 | T | `sections.ts:21,28,35,42,49` |
| A13 | `Lighting` has olive ambient `#cfd3c0` and a brass bounce | §3 | T | `Experience.tsx:308`, `:310` |
| A14 | `PART_COLOR` lives in `types.ts` | §3 | T | `types.ts:88` |
| A15 | The scene is authored in millimetres | §3 | T | `types.ts:31`, `:60-64`. The GLB is also mm, but see A41 |
| A16 | The DisplayPanel shell is `#0b0f08` | §3 | T | `DisplayPanel.tsx:163` |
| A17 | DisplayPanel status/error text uses `text-amber` | §3 | T\* | The class is present at `DisplayPanel.tsx:219`, **but has no effect**: `.readout { color: var(--armed) }` is unlayered and beats `@layer utilities` (confirmed in built CSS `.next/static/chunks/2-wwy0uqrg2j9.css`). The error text renders **green** today |
| A18 | Canvas `dpr` is `[1, 2]` | §3 | T | `Experience.tsx:318` |
| A19 | The plan's mobile Lighthouse floor is 70 | §3 | T | `plan-2026-09-07…md:25`, `:255` |
| A20 | `/subscribed` uses `min-h-screen` | §4 | T | `subscribed/page.tsx:44` |
| A21 | `/subscribed` has three states | §4 | T | `subscribed/page.tsx:9` |
| A22 | The confirmation email has a `COLORS` table | §4 | T | `confirm-address.tsx:32-42` |
| A23 | The email uses inline styles only, no webfonts, no images, single column | §4 | T | No `Img` import (`:1-12`); `grep className\|Img\|<style` matches only a comment at `:24`; one `Container` of max 520px (`:73-79`), no flex/grid; the only "image" is a CSS gradient at `:86` |
| A24 | The root title is a `TODO(copy)` placeholder | §4 | T | `layout.tsx:16-17` |
| A25 | `CAPTURE_SITE_URL` is the env var the confirm link uses | §4 | T | `api/capture/route.ts:10` → `:63` `origin = SITE_URL ?? new URL(request.url).origin` → `:64` `confirmUrl` → `:77` |
| A26 | The CC-BY credit exists in `credits.ts` | §4 | T | `credits.ts:24-33` "C4 bomb \| CS2" by Alex, CC BY 4.0; `href: null` (still TODO) |
| A27 | The Next metadata docs exist at `…/01-metadata/` | §4 | T | directory lists `opengraph-image.md`, `manifest.md`, … |
| A28 | `SCATTER.casing` starts 420 mm below its seat | B1 | T | `gltf-rig.ts:52` |
| A29 | At progress 0 the casing is out of frame, so stage 1 shows nothing | B1 | T | Computed: casing start box y[−548.2, −290.4]; the frustum's bottom edge at nearest depth is y −195.7, so it is ~95 mm out. **Every** mover has 0 in-frustum vertices at p=0 at 1440×900, 1280×800, 390×844 and 360×780 |
| A30 | `build_device_glb.py` classifies grey parts below `BRICK_TOP_Z` as `casing` | B2 | T | `build_device_glb.py:124-130` |
| A31 | The harness classifier is `s > 0.50` | B2 | T | `build_device_glb.py:135-136` |
| A32 | The black wire fails `s > 0.50`, so it seats outside `harness` | B2 | F | The outcome is true, the cause is wrong. The black (798 tris) **and red** (1126 tris) wire runs sit below `BRICK_TOP_Z`, so they go to `casing` at `:130` and the saturation test never runs on them. 104 deck-level black tris reached the test and went to `panel`. `harness` holds no wire-strip triangles at all |
| A33 | The red/black cable runs seat at stage 2 | B2 | T\* | They are in `casing`, so they seat over [0, 0.2], i.e. by the end of stage 1. The **yellow** wire (974 tris) is in `charge_3` (hue ~53 passes the tan test at `:127`) and flies in with brick 3 at stage 2 |
| A34 | The LCD overlay is offset from the model's LCD | B3 | T | Geometry: textured LCD glass on the `panel` mesh spans x[−30.7, 53.5], centre 11.4, y[53.7, 71.0]. `DisplayAnchor` is centred on the separate LCD-plane mesh at x **17.12**, y 61.62. The shell (87.6×28.3) spans x[−26.7, 60.9], so it exposes 4 mm of glass on the left and overshoots 7.4 mm on the right. It is 28.3 tall against 17.3 of glass |
| A35 | `PANEL_WIDTH`/`PANEL_HEIGHT` were measured on the placeholder rig | B3 | T\* | `git log -S PANEL_WIDTH`: introduced 7a3c9fd (placeholder era). But they measure the **DOM shell** and don't depend on the rig: 240px × `scale` 14.6 / 40 = 87.6 exactly. They only set push distance. They are **not the cause** of A34 |
| A36 | The model has three bricks, not four | B4 | T | `build_device_glb.py:106,115`; `CHARGE_SCATTER` 3 entries; GLB has `charge_1..3` |
| A37 | `/api/capture` uses the same Zod schema as the client | Parked | T | `route.ts:6,43`, `DisplayPanel.tsx:10,94` both import `CaptureInput` |
| A38 | `public/models/` is gitignored, so a git deploy ships no model | Parked | F | `.gitignore:58-59` `/public/models/*` then `!/public/models/c4-device.glb`; `git ls-files` lists it (tracked since 7e57fdd). A deploy does show the placeholder by default, but because `device-model.ts:54-55` turns the model off in production when the env var is unset. Stale "gitignored" comments at `device-model.ts:9,16` and `build_device_glb.py:3` |
| A39 | The GLB is 2.4 MB | Parked | T | 2,443,088 bytes |
| A40 | Consent tokens are signed and expiring | Parked | T\* | HMAC-SHA256 (`consent-token.ts:30-32,39-40`), 7-day TTL (`:14`, checked `:87`), `timingSafeEqual` after a length check (`:64-66`). But **not purpose-bound** (payload `{e, x}` only) and **not single-use** (stateless, replayable for 7 days) |
| A41 | *(implicit)* `REFERENCE_BOUNDS` (165.5×250×81.4) describes the shipped model | §3 | F | The GLB measures **179.44×253.80×78.83**. `baseTarget` uses `B.x` |
| A42 | *(implicit)* Retinting `PART_COLOR` changes the real model's look | §3 | F | `paint()` skips materials that have a map (`gltf-rig.ts:187`). The GLB body material `weapon_c4` has a `baseColorTexture`, so only the untextured LCD-plane material takes `PART_COLOR.panel` |
| A43 | *(implicit)* Deleting `.dim-device` removes all mobile dimming | §2 | F | The reduced-motion branch has its own `opacity-30 md:opacity-100` wrapper (`Experience.tsx:354`) |

## B. Arithmetic

| # | Statement | § | T/F | Evidence |
|---|---|---|---|---|
| B1 | `#111111` on `#F5F5F2` is 17.3:1 | §1 | T | script: 17.29 |
| B2 | `#6B6B6B` on `#F5F5F2` is 4.9:1 (AA) | §1 | T | 4.88 |
| B3 | `#FF4F00` on `#F5F5F2` is 3.0:1 (non-text only) | §1 | T | 3.02, which passes 3:1 by 0.02 |
| B4 | `#C73E00` on `#F5F5F2` is 4.7:1 (AA) | §1 | T | 4.67 |
| B5 | `#FF4F00` on `#0b0f08` is ~6:1 | §3 | T | 5.87 |
| B6 | Centring at 29% of height needs `Δy = 0.42 · dist · tan(fov/2)` | §2 | T | half-height = d·tan(fov/2) = 50% of screen; 21% = 0.42 × that |
| B7 | The device's back face is at ~−41 mm | §3 | T\* | Real value **−39.41**; −41 came from `REFERENCE_BOUNDS.z/2`. The assembled box is z[−39.41, +39.41] (centred by `build_device_glb.py:188-198`) |
| B8 | The furthest scatter origin is ≈ −180 and no part passes behind a −220 plane | §3 | F | charge_2's pivot starts at −151.2, but its rotated geometry reaches **−233.1**, behind the plane until p ≈ 0.25 (out of frame throughout) |
| B9 | `far={260}` from z −220 reaches the front face | §3 | T (conditional) | The front face is +39.41, so the margin is 0.59 mm. My pre-fill F (which assumed +40.7) is overturned. Holds only if the plane projects along +z; see C15 |
| B10 | `scale={520}` covers the device and in-frame scatter paths | §3 | T\* (conditional) | OK at 1440×900, 768×1024, 390×844 and 360×780. **Fails** at 1920×1080 (worst x 278) and 1680×720 (worst x 391). Same orientation condition |
| B11 | *(implicit)* Translating the camera alone fits the device in the top 58% on phones | §2 | F | At distance 550 on 390×844 the device fills **74% of height and 117% of width**. A mobile-specific camera distance is required |

## C. Library and framework behaviour

| # | Statement | § | T/F | Evidence |
|---|---|---|---|---|
| C1 | drei `Html` (transform, perspective) uses only `projectionMatrix.elements[5]` and ignores `setViewOffset` terms | §2 | T | `Html.js:221` transform mode skips `calculatePosition`; `:250` `elements[5]`; `:259` `translateZ(${fov}px)` + `matrixWorldInverse`. `DisplayPanel.tsx:137-156` uses `<Html transform scale={14.6} occlude>`. Side note: `occlude` raycasting (`:25-38`) does use `project` |
| C2 | So `setViewOffset` would misalign the LCD and the overlay | §2 | T\* | Follows from C1; not observed in a browser. Camera translation is tracked correctly |
| C3 | Tailwind v4 emits nothing for an unknown class and doesn't fail the build | §1 | T | Scratchpad run of installed `@tailwindcss/postcss` 4.3.3. Caveat: `amber-500`-style default-palette classes still compile, and `bg-[var(--nope)]` compiles to an undefined var |
| C4 | Geist and Geist Mono are in `next/font/google` | §1 | T | `font-data.json` wght 100–900 variable; exports `Geist`, `Geist_Mono` (`google/index.d.ts:5664,5674`) |
| C5 | `next/font/google` exposes no file path | §4 | T | `@next/font/dist/types.d.ts:3-11` |
| C6 | Satori accepts TTF/OTF/WOFF, not WOFF2 | §4 | T | `docs/…/image-response.md:52`; `@vercel/og/index.node.js:12783-12803` throws on wOF2. `next/og` already bundles `Geist-Regular.ttf` |
| C7 | `next/og` exports `ImageResponse` | §4 | T | `next/og.js` → `dist/server/og/image-response` |
| C8 | `twitter-image.tsx` may re-export the OG image | §4 | T\* | Scratchpad `next build` OK with `export { default, alt, size, contentType } from './opengraph-image'`. **`export *` drops `default`**, so the named form is required |
| C9 | `metadata.title` accepts `{ default, template }` | §4 | T | `generate-metadata.md:241-289`. The template applies to children, so `/subscribed` becomes "Address confirmed · Five stages to armed" |
| C10 | Without `metadataBase`, OG URLs are relative and scrapers show no image | §4 | F | `resolve-opengraph.js:79-99`, `resolve-url.js:58-69`: falls back to localhost (dev), `VERCEL_URL` (preview) or `VERCEL_PROJECT_PRODUCTION_URL` (prod). **The spec's `?? 'http://localhost:3000'` would override that and ship localhost OG URLs in production, with no warning** (scratchpad build) |
| C11 | `themeColor` belongs in the `viewport` export | §4 | T | `generate-metadata.md:652-654`; the build emits `theme-color` |
| C12 | `viewport` supports `viewportFit` and `interactiveWidget` | §2 | T | `extra-types.d.ts:52-53`; the build emits both |
| C13 | `<Environment>` with only `<Lightformer>` children downloads nothing | §3 | T\* | `Environment.js:196-198`, `:147-152`. Caveat: the portal cubeCamera has `far=1000` (`:86-88`), so Lightformers must sit within 1000 mm or `far` must be passed |
| C14 | ContactShadows projects along its local +y | §3 | F | `ContactShadows.js:118-135`: the camera looks along the group's local **−z**; drei's own `rotation-x: π/2` makes that world +y (a floor) |
| C15 | `rotation={[Math.PI/2,0,0]}` points the projection at the camera | §3 | F | That is drei's default floor orientation (a user `rotation` replaces it). Computed: `[0, π, 0]` or `[π, 0, 0]` looks along world +z. Mirroring to be confirmed on a screenshot |
| C16 | ContactShadows defaults assume metres | §3 | T\* | Defaults `scale=10`, `far=10`, `resolution=512`, `blur=1`, `frames=Infinity` are unitless; here they mean a 10 mm plane. The conclusion (set explicitly) holds |
| C17 | ScrollControls recomputes page height on resize | §2 | T\* | `ScrollControls.js:85,162`. `scroll.current` updates only in `onScroll` while px `scrollTop` is preserved, so the offset **jumps on the next scroll** after a resize (e.g. ~0.59 at stage 5) |
| C18 | R3F resizes the canvas when its container changes | §2 | T | `react-three-fiber.esm.js:42-49,135-141` react-use-measure (ResizeObserver + resize), setState only on a real change |
| C19 | *(implicit)* ContactShadows gives a visible halo on the assembled device | §3 | F | Alpha = 1 − depth/far (`ContactShadows.js:49`). With the back face 179 mm from the plane, the peak is ~0.31 × opacity 0.3 ≈ **0.09** before blur. Parts in flight near the plane are ~3× darker than the assembled device. Default `frames=Infinity` re-renders the scene every frame |
| C20 | *(implicit)* The OG route fits `next/og` limits | §4 | ? | `image-response.md:51`: a 500 KB bundle limit. Two TTFs (128 + 149 KB) plus a ~150 KB PNG ≈ 427 KB. It's unclear whether `readFile` assets count |

## D. Platform and web behaviour

| # | Statement | § | T/F | Evidence |
|---|---|---|---|---|
| D1 | `100vh` resizes the canvas as in-app toolbars collapse; `100svh` stays fixed | §2 | F | [MDN length](https://developer.mozilla.org/en-US/docs/Web/CSS/length): `vh` = `lvh`, static; only `dvh` follows toolbars. `svh` is still the right choice, for a different reason: an `lvh` box's bottom sits **under** visible toolbars, which would hide the bottom copy band. The page scrolls inside drei's nested div, so the toolbars may never collapse |
| D2 | `interactiveWidget: 'resizes-visual'` stops the keyboard resizing the layout in Android webviews | §2 | F | [Chrome blog](https://developer.chrome.com/blog/viewport-resize-behavior): Chrome Android 108+ already defaults to it, and "these changes do not affect WebView"; [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/ge7xTu-VhJ0): WebView sizing is the host app's `windowSoftInputMode`. The premise (webviews can resize) is T; the remedy is F |
| D3 | 44×44 CSS px is the recommended minimum tap target | §2 | T\* | WCAG 2.2 SC 2.5.5 (AAA) 44×44; SC 2.5.8 (AA) 24×24; Apple HIG 44 pt; Material 48 dp |
| D4 | Geist is SIL OFL 1.1 from the official `geist-font` release | §4 | T | [vercel/geist-font](https://github.com/vercel/geist-font) v1.7.2; `fonts/Geist/ttf/Geist-SemiBold.ttf` 127,872 B, `fonts/GeistMono/ttf/GeistMono-Regular.ttf` 149,284 B |
| D5 | A PNG rendered from a CC BY 4.0 model needs attribution | §4 | T\* | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) §3(a)(1). §3(a)(1)(B) also requires indicating modification (the GLB is regrouped; `credits.ts` doesn't say so). §3(a)(2) "reasonable manner" means an on-card credit is one option. **Licence chain:** "C4 bomb \| CS2" is a fan model of a Valve asset; the uploader's CC BY cannot license Valve's design |
| D6 | A dark solid button survives email dark-mode inversion better than a saturated fill | §4 | ? | Judgment. Litmus: in partial-invert clients (Outlook apps) the white card darkens while `#111` stays, so the button loses its edge. No evidence for "better" |
| D7 | A detonator render in a preview card may trip link-safety review | §4 | ? | Judgment. Meta Ad Standards cover **ads** and allow game/fiction contexts; no evidence of organic preview suppression. Organic IG/TikTok posts show no OG card; it matters on X, Facebook and messaging apps |

## Not verifiable: decisions and requirements

These are choices rather than claims, so they have no truth value:

- visual direction (light studio), type (Geist, Swiss treatment), accent (signal orange);
- token values, stage-label format, gutters;
- mobile layout (device top, copy band);
- shadow opacity/blur, placeholder colours;
- email layout, OG card composition;
- the verification checklist, Phase B scope, parked items.
