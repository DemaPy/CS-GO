# Light Studio Redesign (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the scroll-driven 3D landing page, `/subscribed`, the confirmation email and the social card from the olive/brass military look to a clean, mobile-first light studio design, without changing any copy.

**Architecture:** Colour and type come from one token set. It lives in `globals.css` for the page and in `src/content/palette.ts` for places that can't read CSS (the email and the OG image), and a test keeps the two identical. Camera framing moves out of `Experience.tsx` into a pure `src/three/framing.ts`. Unit tests run it against the real GLB, parsed in Node, so the mobile layout (device in the top band) and the shadow geometry are checked by numbers, not by eye. The fix for the Android-webview keyboard is a small pure reducer (`scroll-freeze.ts`) that holds scroll progress while the LCD input is focused.

**Tech Stack:**
- Next.js 16.3.4 (App Router), React 19.2.8, TypeScript 5.9;
- Tailwind CSS 4.3.3;
- three 0.185.1, @react-three/fiber 9.7.0, @react-three/drei 10.7.8;
- react-email; `next/og`;
- Vitest (new, dev-only); pnpm 9.12.0; Node 22.

**Spec:** `docs/superpowers/specs/2026-09-27-light-studio-redesign-design.md`.
Evidence for every factual claim is in
`docs/superpowers/specs/2026-09-27-light-studio-redesign-verification.md`. Row
IDs such as (A17) and (C15) refer to it.

**Phase B** (the 3D fixes: empty stage 1, tape/wire grouping, LCD offset,
`REFERENCE_BOUNDS`, the "four charges" flag) gets its own plan **after the user
signs off Phase A**. It is not in this plan.

## Global Constraints

- **Copy is frozen.** No string in `src/content/sections.ts`, `subscribed/page.tsx` `COPY`, `confirm-address.tsx`, or the `'Five stages to armed'` title may change. New visible text is limited to the stage label (`01 / 05 · CASING`, derived from index and `id`) and the licence notice `regrouped for animation`.
- Tokens, and nothing else: `--ground #F5F5F2`, `--ink #111111`, `--muted #6B6B6B`, `--rule #E2E2DD`, `--signal #FF4F00`, `--signal-ink #C73E00`, `--armed #4EE27B`. The device and the LCD are the only exceptions.
- `--signal` is **fills only**; orange **text** uses `--signal-ink`. `--signal` may not be lightened (3.02:1 against a 3:1 floor).
- Type: Geist + Geist Mono via `next/font/google`. No Archivo, no `font-stretch`.
- The scene is in **millimetres**. drei defaults are unitless and must be set explicitly.
- Never use `camera.setViewOffset`. drei `Html` in transform mode ignores it (C1).
- drei `<Environment>` gets `<Lightformer>` children only: no `files`, no `preset`, no HDR download.
- No horizontal page scroll at any width (plan Step 5.6).
- `prefers-reduced-motion: reduce` still renders the assembled device with no scrub, and the email step is still reachable.
- Mobile Lighthouse performance ≥ 70.
- Before touching Next APIs, read the matching guide in `node_modules/next/dist/docs/` (`AGENTS.md`).
- Claude cannot write `.env*` files. Env changes go in `docs/env-vars.md` and `env.local.example` only.
- Package manager: `pnpm`. Commit after every task.

## Review Focus

1. **The visitor scrolls while the LCD input is focused** (keyboard open). The page should scroll normally: the freeze releases, and the page must not jump back. *Test: Task 5, `userScroll` releases without a restore.*
2. **The viewport height changes while the input is focused** (Android webview keyboard, or rotating the phone). The display should stay lit. On blur, progress returns to the same fraction of the new scroll length. A restore that can't converge must not freeze the page. *Tests: Task 5, `scrollTopFor` with new dimensions, and the release frame cap.*
3. **`CAPTURE_SITE_URL` is empty or malformed.** Empty should behave as unset. Malformed (`example.com`) should fail the build with a message naming the variable, not ship broken preview URLs. *Test: Task 10.*
4. **A landscape phone at 844×390** is ≥768 px wide, so it takes the desktop branch. The device must be fully in frame and right of the copy column. *Test: Task 3.*
5. **The placeholder rig**, which is what production renders today (A38). The framing and shadow criteria must hold for it as well as for the GLB. *Tests: Tasks 3 and 6 run both rigs.*

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `vitest.config.ts` | test runner, `@/` alias | 1 |
| `src/content/palette.ts` | hex token table for non-CSS consumers | 1 |
| `src/test/contrast.ts` | WCAG contrast helper (test-only) | 1 |
| `src/test/palette.test.ts` | CSS tokens = `PALETTE`; contrast floors; `.readout-alert` order | 1 |
| `src/test/palette-guard.test.ts` | no old-palette names anywhere in `src` | 1 |
| `src/app/globals.css` | tokens, type classes, LCD classes | 1, 3, 4 |
| `src/app/layout.tsx` | fonts, metadata, viewport | 1, 4, 10 |
| `src/content/stage-label.ts` (+ test) | `01 / 05 · CASING` | 2 |
| `src/components/Overlay.tsx` | section copy blocks | 2, 4 |
| `src/test/load-glb.ts` | GLB → three geometry graph in Node (test-only) | 3 |
| `src/test/project.ts` | camera + NDC bounds helpers (test-only) | 3 |
| `src/three/framing.ts` (+ test) | camera pose per progress/viewport | 3 |
| `src/components/Experience.tsx` | wiring | 3, 4, 5, 6 |
| `src/components/Credits.tsx`, `src/content/credits.ts` | attribution line | 4 |
| `src/lib/scroll-freeze.ts` (+ test) | freeze reducer | 5 |
| `src/components/DisplayPanel.tsx` | LCD input | 1, 5, 7 |
| `src/three/shadow.ts` (+ test) | back-wall shadow constants | 6 |
| `src/three/StudioLighting.tsx` | Lightformer env + key light + shadow | 6 |
| `src/three/assembly/types.ts` | `PART_COLOR` | 1 |
| `src/app/subscribed/page.tsx` | confirmation landing | 8 |
| `src/emails/confirm-address.tsx`, `src/lib/consent-email.test.ts` | email | 9 |
| `src/content/site.ts`, `src/lib/site-url.ts` (+ test) | title, metadataBase | 10 |
| `src/app/og-capture/page.tsx`, `src/app/og-capture/CaptureScene.tsx` | dev-only render for the OG PNG | 11 |
| `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`, `src/app/og-fonts/*`, `public/og/device.png` | social card | 11 |
| `docs/verification.md` | evidence record | 12 |

---

### Task 1: Test runner, tokens, fonts, and migrating every old-palette usage

**Files:**
- Create: `vitest.config.ts`, `src/content/palette.ts`, `src/test/contrast.ts`, `src/test/palette.test.ts`, `src/test/palette-guard.test.ts`
- Modify: `package.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/Overlay.tsx:44-60`, `src/components/Credits.tsx:24-45`, `src/app/subscribed/page.tsx:46-63`, `src/components/DisplayPanel.tsx:214-222`, `src/three/assembly/types.ts:80-94`

**Interfaces:**
- Produces:
  - `PALETTE: { ground, ink, muted, rule, signal, signalInk, armed, lcd }`, all `#RRGGBB` strings, from `@/content/palette`;
  - `contrast(a: string, b: string): number` from `@/test/contrast`;
  - Tailwind utilities `*-ground`, `*-ink`, `*-muted`, `*-rule`, `*-signal`, `*-signal-ink`, `*-armed`, `font-mono`;
  - the CSS classes `.readout-alert` and `.h-display`;
  - `pnpm test`.

- [ ] **Step 1: Install Vitest and add the script**

```bash
pnpm add -D vitest
```

In `package.json` `"scripts"` add `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // The GLB-driven framing and shadow tests project every vertex of the
    // model at hundreds of poses; the default 5s is not enough.
    testTimeout: 60_000,
  },
})
```

- [ ] **Step 2: Write the palette table and the contrast helper**

`src/content/palette.ts`:

```ts
/**
 * The light studio palette, as hex, for consumers that cannot read CSS custom
 * properties: the confirmation email (inline styles only) and the OG image
 * (Satori). `globals.css` `:root` is the page's copy of the same table, and
 * `src/test/palette.test.ts` fails if the two drift.
 *
 * `signal` is for FILLS ONLY (3.02:1 on ground). Orange text uses `signalInk`.
 */
export const PALETTE = {
  ground: '#F5F5F2',
  ink: '#111111',
  muted: '#6B6B6B',
  rule: '#E2E2DD',
  signal: '#FF4F00',
  signalInk: '#C73E00',
  armed: '#4EE27B',
  /** The LCD glass. Part of the device, not the page theme. */
  lcd: '#0B0F08',
} as const
```

`src/test/contrast.ts`:

```ts
/** WCAG 2.x relative luminance of a #RRGGBB colour. */
export function luminance(hex: string): number {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio, always >= 1. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
```

- [ ] **Step 3: Write the failing palette tests**

`src/test/palette.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PALETTE } from '@/content/palette'
import { contrast } from '@/test/contrast'

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

function rootVars(): Record<string, string> {
  const block = css.match(/:root\s*{([^}]*)}/)
  if (!block) throw new Error('globals.css has no :root block')
  const vars: Record<string, string> = {}
  for (const m of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[m[1]] = m[2].toUpperCase()
  }
  return vars
}

describe('palette', () => {
  it('globals.css :root matches PALETTE exactly', () => {
    expect(rootVars()).toEqual({
      ground: PALETTE.ground,
      ink: PALETTE.ink,
      muted: PALETTE.muted,
      rule: PALETTE.rule,
      signal: PALETTE.signal,
      'signal-ink': PALETTE.signalInk,
      armed: PALETTE.armed,
    })
  })

  it('text tokens pass WCAG AA on ground', () => {
    expect(contrast(PALETTE.ink, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(PALETTE.muted, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(PALETTE.signalInk, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
  })

  it('signal passes 3:1 for non-text on ground, and fails text AA (so it stays fills-only)', () => {
    const ratio = contrast(PALETTE.signal, PALETTE.ground)
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThan(4.5)
  })

  it('white on the signal-ink email button passes AA', () => {
    expect(contrast('#FFFFFF', PALETTE.signalInk)).toBeGreaterThanOrEqual(4.5)
  })

  it('LCD alert text (signal on LCD glass) passes AA', () => {
    expect(contrast(PALETTE.signal, PALETTE.lcd)).toBeGreaterThanOrEqual(4.5)
  })

  it('.readout-alert is declared after .readout, unlayered, so it wins (A17)', () => {
    const readout = css.indexOf('.readout {')
    const alert = css.indexOf('.readout-alert {')
    expect(readout).toBeGreaterThan(-1)
    expect(alert).toBeGreaterThan(readout)
    expect(css.slice(alert, css.indexOf('}', alert))).toContain('color: var(--signal)')
  })
})
```

`src/test/palette-guard.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Tailwind v4 silently emits nothing for an unknown class (C3), so a missed
// migration renders colourless instead of failing the build. This is the check.
const OLD = '(?:surface|canvas|brass|amber|paper)'
const PATTERNS: [string, RegExp][] = [
  ['old utility', new RegExp(`\\b(?:text|bg|border|decoration|outline|ring|fill|stroke|divide|shadow|accent|caret|placeholder|from|to|via)-${OLD}\\b`)],
  ['old custom property', new RegExp(`--${OLD}\\b`)],
  ['default-palette amber', /\b(?:text|bg|border|decoration|ring|fill|stroke|from|to|via)-amber-\d{2,3}\b/],
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

describe('old palette is gone', () => {
  it('no source file uses an old token name', () => {
    const src = join(process.cwd(), 'src')
    const hits: string[] = []
    for (const file of files(src)) {
      if (file.endsWith('palette-guard.test.ts')) continue
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        for (const [what, re] of PATTERNS) {
          if (re.test(line)) hits.push(`${relative(src, file)}:${i + 1} ${what}: ${line.trim()}`)
        }
      })
    }
    expect(hits).toEqual([])
  })
})
```

- [ ] **Step 4: Run the tests and confirm they fail**

Run: `pnpm test`
Expected: FAIL.
- `palette.test.ts`: the `:root` mismatch (it still has `surface`, `canvas`, …) and `.readout-alert` missing.
- `palette-guard.test.ts`: lists `Overlay.tsx`, `Credits.tsx`, `subscribed/page.tsx`, `DisplayPanel.tsx`, `globals.css` and `types.ts` hits.

- [ ] **Step 5: Rewrite `globals.css`**

Replace lines 1-47 (from `@import` through the end of `.h-display`) with:

```css
@import "tailwindcss";

/* Palette per docs/superpowers/specs/2026-09-27-light-studio-redesign-design.md §1.
   Defined once for the page, here. src/content/palette.ts holds the same table
   for the email and the OG image; src/test/palette.test.ts keeps them equal.
   A device lit on a light studio table. */
:root {
  --ground: #F5F5F2; /* page background: warm off-white, so the model does not look cut out */
  --ink: #111111; /* headings, primary text: 17.29:1 on ground */
  --muted: #6B6B6B; /* body, stage label, credits: 4.88:1, AA */
  --rule: #E2E2DD; /* hairlines, the mobile divider: decorative */
  --signal: #FF4F00; /* FILLS ONLY (ticks, focus ring): 3.02:1, fails AA for text */
  --signal-ink: #C73E00; /* orange TEXT and links: 4.67:1, AA */
  --armed: #4EE27B; /* display green: the LCD only, nowhere else */
}

@theme inline {
  --color-ground: var(--ground);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-rule: var(--rule);
  --color-signal: var(--signal);
  --color-signal-ink: var(--signal-ink);
  --color-armed: var(--armed);
  --font-sans: var(--font-geist);
  --font-mono: var(--font-geist-mono);
  --font-seven: var(--font-seven);
}

/* Light only. The page is one art-directed scene, not an app theme, so there is
   no dark variant to keep in step. The LCD stays dark because it is part of
   the device, not the page. */
html,
body {
  height: 100%;
  background: var(--ground);
  color: var(--ink);
}

body {
  font-family: var(--font-geist), system-ui, sans-serif;
  /* Step 5.6: the page must never scroll horizontally at any width. */
  overflow-x: hidden;
}

/* Swiss grotesk: one family, normal width, tight tracking. */
.h-display {
  font-family: var(--font-geist), system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.02;
  text-wrap: balance;
}
```

Directly after the existing `.readout { … }` rule, add:

```css
/* Status and error text on the LCD. It MUST stay unlayered and come after
   .readout: .readout is unlayered, so it beats any @layer utilities class, which
   is why the old `text-amber` rendered green (A17). Signal on the dark glass is
   5.87:1. */
.readout-alert {
  color: var(--signal);
}
```

In `:focus-visible`, change `outline: 2px solid var(--amber);` to `outline: 2px solid var(--signal);`.

Leave `.dim-device` in place for now; Task 3 removes it.

- [ ] **Step 6: Swap the fonts in `layout.tsx`**

Replace the Archivo import and constant (lines 2-13) with:

```tsx
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Geist for everything, Geist Mono for the stage label and credits. Normal
// width only: the old 125% `wdth` stretch is what read as military.
const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})
```

and change the `<html>` className to
`` `${geist.variable} ${geistMono.variable} h-full antialiased` ``.

- [ ] **Step 7: Migrate every old-palette usage, class by class**

| File:line | From | To |
|---|---|---|
| `Overlay.tsx:44` | `text-amber` | `text-signal-ink` |
| `Overlay.tsx:47` | `border-brass` | `border-signal` |
| `Overlay.tsx:54` | `text-paper` | `text-ink` |
| `Overlay.tsx:60` | `text-paper/70` | `text-muted` |
| `Credits.tsx:24` | `bg-surface/70 … text-paper/45` | `bg-ground/80 … text-muted` |
| `Credits.tsx:27` | `text-brass` | `text-rule` |
| `Credits.tsx:33,45` | `decoration-brass/60 … hover:text-paper/80` | `decoration-rule … hover:text-ink` |
| `subscribed/page.tsx:46` | `text-amber` | `text-signal-ink` |
| `subscribed/page.tsx:49` | `border-brass` | `border-signal` |
| `subscribed/page.tsx:54` | `text-paper` | `text-ink` |
| `subscribed/page.tsx:58` | `text-paper/70` | `text-muted` |
| `subscribed/page.tsx:63` | `border-brass … text-paper/80` | `border-signal … text-ink` |
| `DisplayPanel.tsx:219` | `text-amber` | `readout-alert` (keep `readout` too: `"readout readout-alert mt-[9px] …"`) |

In `DisplayPanel.tsx`, replace the comment above that `<p>` with:

```tsx
              // Signal orange, not red: the message is a correction, not an
              // alarm. `readout-alert`, not a utility class; see globals.css.
```

In `src/three/assembly/types.ts`, replace the `PART_COLOR` doc comment and table (lines 76-94) with:

```ts
/**
 * The device's colours, keyed by the section that seats each group.
 *
 * The placeholder rig builds its boxes from this table. The glTF rig only
 * tints materials that carry NO texture (`paint()` in gltf-rig.ts). On the
 * shipped model that is just the LCD-plane material, so on the real device
 * only `panel` shows (A42). Light studio set: graphite and aluminium, with the
 * harness in the page's signal orange.
 */
export const PART_COLOR: Record<SectionId, number> = {
  casing: 0x3a3d40, // graphite
  charges: 0xb8bcc0, // aluminium grey
  harness: 0xff4f00, // signal, the one saturated part
  panel: 0x14161a, // near-black, waiting for the readout
  arm: 0x3a3d40, // graphite, same metal as the casing
}
```

- [ ] **Step 8: Run the tests, then check the build**

Run: `pnpm test`
Expected: PASS (both files).

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm build`
Expected: all exit 0.

- [ ] **Step 9: Look at it**

Run `pnpm dev`. In Chrome DevTools at 1440×900, open `http://localhost:3000`:
- the ground is off-white, the headings are Geist (not stretched), and the stage label is orange;
- the device still renders.

Take one screenshot for the record.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/content/palette.ts src/test src/app/globals.css src/app/layout.tsx src/components/Overlay.tsx src/components/Credits.tsx src/app/subscribed/page.tsx src/components/DisplayPanel.tsx src/three/assembly/types.ts
git commit -m "Light studio tokens and Geist, with a test that the old palette is gone"
```

---

### Task 2: The stage label, heading and body type, and restoring the stage 5 body line

**Files:**
- Create: `src/content/stage-label.ts`, `src/content/stage-label.test.ts`
- Modify: `src/components/Overlay.tsx` (whole file)

**Interfaces:**
- Consumes: `SECTIONS`, `SectionId` from `@/content/sections`; the Task 1 utilities.
- Produces: `stageLabel(index: number, total: number, id: string): { count: string; name: string }`.

- [ ] **Step 1: Write the failing test**

`src/content/stage-label.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { stageLabel } from '@/content/stage-label'

describe('stageLabel', () => {
  it('zero-pads to two digits and upper-cases the id', () => {
    expect(stageLabel(0, 5, 'casing')).toEqual({ count: '01 / 05', name: 'CASING' })
    expect(stageLabel(4, 5, 'arm')).toEqual({ count: '05 / 05', name: 'ARM' })
  })

  it('pads to the width of the total when it has more digits', () => {
    expect(stageLabel(9, 120, 'x')).toEqual({ count: '010 / 120', name: 'X' })
  })

  it('rejects an index outside the sequence', () => {
    expect(() => stageLabel(5, 5, 'arm')).toThrow(RangeError)
    expect(() => stageLabel(-1, 5, 'arm')).toThrow(RangeError)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/content/stage-label.test.ts`
Expected: FAIL, "Failed to resolve import '@/content/stage-label'".

- [ ] **Step 3: Implement**

`src/content/stage-label.ts`:

```ts
/**
 * The mono stage label: `01 / 05 · CASING`.
 *
 * Derived from the section's position and id rather than written as copy, so
 * adding or reordering a section cannot leave a stale number on screen. The
 * human-readable `eyebrow` ("Stage one") still exists and is what screen
 * readers get; see Overlay.
 */
export function stageLabel(
  index: number,
  total: number,
  id: string,
): { count: string; name: string } {
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError(`stage index ${index} is outside 0..${total - 1}`)
  }
  const width = Math.max(2, String(total).length)
  const pad = (n: number) => String(n).padStart(width, '0')
  return { count: `${pad(index + 1)} / ${pad(total)}`, name: id.toUpperCase() }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test src/content/stage-label.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `Overlay.tsx`**

The section wrapper classes stay as they are today; Task 4 changes them for mobile.

```tsx
import { SECTIONS } from '@/content/sections'
import { stageLabel } from '@/content/stage-label'

/**
 * The five scrolling copy blocks (plan Step 5.3).
 *
 * Copy is pinned left at ~34ch and vertically centred; the device holds the
 * right two-thirds on desktop.
 *
 * No entrance animation. The scroll scrub is the page's entire motion budget.
 */
export function Overlay() {
  return (
    <div className="w-screen">
      {SECTIONS.map((section, i) => {
        const isLast = i === SECTIONS.length - 1
        // Section 4's box does not clear the viewport until progress 1.0, so
        // it is still on screen when section 5's copy pins to the top. See
        // the fade in Experience for why that needs a handle.
        const isPenultimate = i === SECTIONS.length - 2
        const label = stageLabel(i, SECTIONS.length, section.id)
        return (
          <section
            key={section.id}
            aria-labelledby={`heading-${section.id}`}
            className={`flex h-screen w-screen px-6 sm:px-10 lg:px-16 ${
              // Section 5 sits above the panel rather than beside it. At full
              // camera push the panel fills the middle of the frame, so copy
              // pinned to the vertical centre gets covered.
              isLast ? 'items-start pt-[7vh]' : 'items-center'
            }`}
          >
            {/* Section 5's copy is pinned by Experience once the panel lights.
                Without it, this block slides up through the lit panel across
                0.80-1.00 and only clears the display at exactly 1.0. */}
            <div
              {...(isLast ? { 'data-stage5-copy': '' } : {})}
              {...(isPenultimate ? { 'data-stage4-copy': '' } : {})}
              className="max-w-[34ch] will-change-transform"
            >
              {/* The mono label is visual; screen readers get the eyebrow
                  ("Stage one"), which reads better than "zero one slash". */}
              <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
                <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
                <span aria-hidden="true">
                  <span className="text-signal-ink">{label.count}</span> · {label.name}
                </span>
                <span className="sr-only">{section.eyebrow}</span>
              </p>

              <h2
                id={`heading-${section.id}`}
                className="h-display text-[clamp(2.25rem,8vw,4rem)] text-ink"
              >
                {section.heading}
              </h2>

              {/* Every section, including 5: without its body the visitor is
                  never told what the input on the display is for (A9). */}
              <p className="mt-5 text-[17px] leading-[1.55] text-muted md:text-lg">
                {section.body}
              </p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Check that stage 5's copy clears the panel on desktop**

With `pnpm dev` running, in Chrome DevTools at 1440×900 and again at 1680×720, scroll to the end (`document.querySelector('[style*="overflow"]')` is drei's scroller; set its `scrollTop` to its `scrollHeight`). Then evaluate:

```js
const copy = document.querySelector('[data-stage5-copy]').getBoundingClientRect()
const shell = document.querySelector('#arm-email').closest('form').parentElement.getBoundingClientRect()
;({ copyBottom: copy.bottom, shellTop: shell.top, gap: shell.top - copy.bottom })
```

Expected: `gap >= 16` at both sizes. If either is below 16, change `PANEL_HEIGHT_FRACTION` in `Experience.tsx` from `0.42` to `0.36` (it moves to `framing.ts` in Task 3) and re-measure. Record both gaps.

- [ ] **Step 7: Run all tests and lint, then commit**

Run: `pnpm test && pnpm lint`
Expected: PASS.

```bash
git add src/content/stage-label.ts src/content/stage-label.test.ts src/components/Overlay.tsx src/components/Experience.tsx
git commit -m "Mono stage label, Geist heading and body, and the stage 5 instruction line"
```

---

### Task 3: Framing module, the mobile device-top layout, and removing mobile dimming

**Files:**
- Create: `src/test/load-glb.ts`, `src/test/project.ts`, `src/three/framing.ts`, `src/three/framing.test.ts`
- Modify: `src/components/Experience.tsx` (constants at lines 21-71, `DeviceScene` `frame()`, the reduced-motion wrapper at line ~354, the Canvas `className` at line ~385), `src/app/globals.css` (delete `.dim-device`)

**Interfaces:**
- Consumes:
  - `createGltfRig(source: Object3D): AssemblyRig` from `@/three/assembly/gltf-rig`;
  - `createPlaceholderRig(): AssemblyRig` from `@/three/assembly/placeholder-rig`;
  - `REFERENCE_BOUNDS`, `smoothstep`, `AssemblyRig` from `@/three/assembly/types`;
  - `subProgress` from `@/content/sections`.
- Produces (from `@/three/framing`):
  - `FOV = 35`, `CAMERA_PUSH: [0.8, 1.0]`, `BASE_DISTANCE = 550`, `PANEL_WIDTH = 87.6`, `PANEL_HEIGHT = 28.3`, `PANEL_WIDTH_FRACTION = 0.72`, `PANEL_HEIGHT_FRACTION = 0.42` (or `0.36` if Task 2 Step 6 changed it), `MOBILE_DEVICE_WIDTH_FRACTION = 0.88`, `MOBILE_DEVICE_HEIGHT_FRACTION = 0.52`, `MOBILE_LIFT = 0.42`;
  - `interface Viewport { width: number; height: number; desktop: boolean }`;
  - `interface DeviceSize { x: number; y: number }`;
  - `interface CameraPose { position: Vector3; target: Vector3 }`;
  - `assembledSize(rig: AssemblyRig): DeviceSize`, which leaves the rig at `seek(0)`;
  - `cameraPose(progress: number, v: Viewport, anchor: Vector3, device: DeviceSize, out: CameraPose): CameraPose`.
- Also produced (test-only):
  - `loadGlbGeometry(path: string): Object3D` from `@/test/load-glb`;
  - `makeCamera(pose: CameraPose, v: Viewport): PerspectiveCamera` from `@/test/project`;
  - `ndcBounds(root: Object3D, camera: Camera): { minX: number; maxX: number; minY: number; maxY: number }` from `@/test/project`.

- [ ] **Step 1: Write the Node GLB loader and the projection helpers**

`src/test/load-glb.ts`:

```ts
import { readFileSync } from 'node:fs'
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
} from 'three'

interface GltfJson {
  scene?: number
  scenes: { nodes: number[] }[]
  nodes: {
    name?: string
    mesh?: number
    children?: number[]
    translation?: number[]
    rotation?: number[]
    scale?: number[]
  }[]
  meshes: { primitives: { attributes: { POSITION: number } }[] }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    count: number
    componentType: number
    type: string
  }[]
  bufferViews: { byteOffset?: number; byteStride?: number }[]
}

/**
 * Loads a GLB's node graph and vertex positions in Node, with no DOM.
 *
 * GLTFLoader needs image decoding for the embedded textures, which Node does
 * not have, and the framing/shadow tests only need geometry. It builds the
 * graph the way GLTFLoader does: a node with a one-primitive mesh IS the Mesh,
 * so `createGltfRig`'s `isMesh` filters see the same shape they see in the
 * browser. Materials are MeshBasicMaterial, which `paint()` leaves alone.
 */
export function loadGlbGeometry(path: string): Object3D {
  const buf = readFileSync(path)
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path} is not a GLB`)
  const jsonLength = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8')) as GltfJson
  const binStart = 20 + jsonLength + 8

  const positions = (index: number): Float32Array => {
    const a = json.accessors[index]
    const view = json.bufferViews[a.bufferView]
    if (a.componentType !== 5126 || a.type !== 'VEC3') {
      throw new Error('POSITION must be a float VEC3 accessor')
    }
    if (view.byteStride && view.byteStride !== 12) {
      throw new Error('interleaved POSITION is not supported')
    }
    const offset = binStart + (view.byteOffset ?? 0) + (a.byteOffset ?? 0)
    const out = new Float32Array(a.count * 3)
    for (let i = 0; i < out.length; i++) out[i] = buf.readFloatLE(offset + i * 4)
    return out
  }

  const meshFor = (index: number): Object3D => {
    const parts = json.meshes[index].primitives.map((p) => {
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(positions(p.attributes.POSITION), 3))
      return new Mesh(g, new MeshBasicMaterial())
    })
    if (parts.length === 1) return parts[0]
    const group = new Group()
    parts.forEach((m) => group.add(m))
    return group
  }

  const objects = json.nodes.map((n) => {
    const o = n.mesh !== undefined ? meshFor(n.mesh) : new Group()
    o.name = n.name ?? ''
    if (n.translation) o.position.fromArray(n.translation)
    if (n.rotation) o.quaternion.fromArray(n.rotation)
    if (n.scale) o.scale.fromArray(n.scale)
    return o
  })
  json.nodes.forEach((n, i) => n.children?.forEach((c) => objects[i].add(objects[c])))

  const root = new Group()
  json.scenes[json.scene ?? 0].nodes.forEach((i) => root.add(objects[i]))
  root.updateMatrixWorld(true)
  return root
}
```

`src/test/project.ts`:

```ts
import { PerspectiveCamera, Vector3, type Camera, type Mesh, type Object3D } from 'three'

import { FOV, type CameraPose, type Viewport } from '@/three/framing'

export function makeCamera(pose: CameraPose, v: Viewport): PerspectiveCamera {
  const cam = new PerspectiveCamera(FOV, v.width / v.height, 10, 10000)
  cam.position.copy(pose.position)
  cam.lookAt(pose.target)
  cam.updateMatrixWorld(true)
  cam.updateProjectionMatrix()
  return cam
}

/** NDC extent of every vertex under `root`; [-1, 1] is on screen. */
export function ndcBounds(root: Object3D, camera: Camera) {
  root.updateMatrixWorld(true)
  const v = new Vector3()
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).project(camera)
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y)
    }
  })
  return { minX, maxX, minY, maxY }
}
```

- [ ] **Step 2: Write the failing framing tests**

`src/three/framing.test.ts`:

```ts
import { join } from 'node:path'
import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { createGltfRig } from '@/three/assembly/gltf-rig'
import { createPlaceholderRig } from '@/three/assembly/placeholder-rig'
import { REFERENCE_BOUNDS as B, type AssemblyRig } from '@/three/assembly/types'
import {
  BASE_DISTANCE,
  PANEL_HEIGHT,
  PANEL_HEIGHT_FRACTION,
  PANEL_WIDTH,
  PANEL_WIDTH_FRACTION,
  assembledSize,
  cameraPose,
  type CameraPose,
  type Viewport,
} from '@/three/framing'
import { loadGlbGeometry } from '@/test/load-glb'
import { makeCamera, ndcBounds } from '@/test/project'

const RIGS: [string, () => AssemblyRig][] = [
  ['glTF', () => createGltfRig(loadGlbGeometry(join(process.cwd(), 'public/models/c4-device.glb')))],
  ['placeholder', () => createPlaceholderRig()],
]
const PHONES: Viewport[] = [
  { width: 390, height: 844, desktop: false },
  { width: 360, height: 780, desktop: false },
]
const pose = (): CameraPose => ({ position: new Vector3(), target: new Vector3() })
const anchorOf = (rig: AssemblyRig) => {
  rig.root.updateMatrixWorld(true)
  return rig.displayAnchor.getWorldPosition(new Vector3())
}
const halfTan = Math.tan((35 * Math.PI) / 360)

describe.each(RIGS)('%s rig framing', (_name, make) => {
  const rig = make()
  const device = assembledSize(rig)

  it('desktop base pose is unchanged from the pre-refactor constants', () => {
    rig.seek(0)
    const p = cameraPose(0, { width: 1440, height: 900, desktop: true }, anchorOf(rig), device, pose())
    expect(p.position.toArray()).toEqual([0, 0, BASE_DISTANCE])
    expect(p.target.toArray()).toEqual([-B.x * 0.55, 0, 0])
  })

  it('desktop full push is unchanged: panel-fit distance straight in front of the anchor', () => {
    rig.seek(1)
    const v = { width: 1440, height: 900, desktop: true }
    const a = anchorOf(rig)
    const aspect = v.width / v.height
    const dist = Math.max(
      PANEL_WIDTH / PANEL_WIDTH_FRACTION / (2 * halfTan * aspect),
      PANEL_HEIGHT / PANEL_HEIGHT_FRACTION / (2 * halfTan),
    )
    const p = cameraPose(1, v, a, device, pose())
    expect(p.position.x).toBeCloseTo(a.x, 6)
    expect(p.position.y).toBeCloseTo(a.y, 6)
    expect(p.position.z).toBeCloseTo(a.z + dist, 6)
    expect(p.target.distanceTo(a)).toBeLessThan(1e-6)
  })

  it.each(PHONES)('assembled device fits the top 58% of a $width x $height phone', (v) => {
    rig.seek(1)
    // 0.79 is before the push, so this is the base mobile framing.
    const cam = makeCamera(cameraPose(0.79, v, anchorOf(rig), device, pose()), v)
    const b = ndcBounds(rig.root, cam)
    expect(b.minX).toBeGreaterThanOrEqual(-1)
    expect(b.maxX).toBeLessThanOrEqual(1)
    expect(b.maxY).toBeLessThanOrEqual(1)
    // Screen fraction from the top = (1 - ndcY) / 2, so 58% => ndcY >= -0.16.
    expect(b.minY).toBeGreaterThanOrEqual(-0.16)
  })

  it.each(PHONES)('at full push the LCD anchor sits at 29% from the top on $width x $height', (v) => {
    rig.seek(1)
    const a = anchorOf(rig)
    const ndc = a.clone().project(makeCamera(cameraPose(1, v, a, device, pose()), v))
    expect(ndc.x).toBeCloseTo(0, 2)
    expect(ndc.y).toBeCloseTo(0.42, 2)
  })

  it.each(PHONES)('mobile camera stays square to the z axis on $width x $height (no skew, C1)', (v) => {
    for (const p of [0, 0.5, 0.85, 1]) {
      rig.seek(p)
      const c = cameraPose(p, v, anchorOf(rig), device, pose())
      expect(c.position.x).toBeCloseTo(c.target.x, 9)
      expect(c.position.y).toBeCloseTo(c.target.y, 9)
    }
  })

  it.each([
    { width: 1440, height: 900, desktop: true },
    { width: 844, height: 390, desktop: true }, // Review Focus 4: landscape phone hits the desktop branch
  ])('desktop $width x $height: assembled device fully in frame, right of the copy column', (v) => {
    rig.seek(1)
    const cam = makeCamera(cameraPose(0.79, v, anchorOf(rig), device, pose()), v)
    const b = ndcBounds(rig.root, cam)
    expect(b.minX).toBeGreaterThanOrEqual(-1 / 3)
    expect(b.maxX).toBeLessThanOrEqual(1)
    expect(b.minY).toBeGreaterThanOrEqual(-1)
    expect(b.maxY).toBeLessThanOrEqual(1)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm test src/three/framing.test.ts`
Expected: FAIL, "Failed to resolve import '@/three/framing'".

- [ ] **Step 4: Implement `framing.ts`**

```ts
import { Box3, Vector3 } from 'three'

import { subProgress } from '@/content/sections'
import { REFERENCE_BOUNDS as B, smoothstep, type AssemblyRig } from '@/three/assembly/types'

/** Must match the Canvas camera in Experience. */
export const FOV = 35

/** Scroll range over which the camera pushes toward the display (Step 5.4). */
export const CAMERA_PUSH: [number, number] = [0.8, 1.0]

/**
 * Desktop framing distance, in the millimetre world units set by
 * REFERENCE_BOUNDS. Device longest dimension is 250 at 35° fov, which needs 400
 * to fit exactly; 550 leaves margin.
 */
export const BASE_DISTANCE = 550

/**
 * World size of the display SHELL, the DOM element, not the model's LCD glass:
 * `w-[240px]` x `<Html scale={14.6}>` / drei's factor of 40 = 87.6 exactly
 * (A35). Only used to set the push distance.
 */
export const PANEL_WIDTH = 87.6
export const PANEL_HEIGHT = 28.3

/** Share of the frame the panel may occupy at full push, per axis. */
export const PANEL_WIDTH_FRACTION = 0.72
export const PANEL_HEIGHT_FRACTION = 0.42

/** Mobile: share of the viewport the assembled device may fill, per axis. */
export const MOBILE_DEVICE_WIDTH_FRACTION = 0.88
export const MOBILE_DEVICE_HEIGHT_FRACTION = 0.52

/**
 * Mobile: how far above screen centre the frame's subject sits, as a fraction
 * of the half-height. 0.42 puts it 21% above centre, i.e. 29% from the top: the
 * middle of the top ~58% band, clear of the copy band and the keyboard.
 */
export const MOBILE_LIFT = 0.42

export interface Viewport {
  width: number
  height: number
  desktop: boolean
}

export interface DeviceSize {
  x: number
  y: number
}

export interface CameraPose {
  position: Vector3
  target: Vector3
}

const HALF_TAN = Math.tan((FOV * Math.PI) / 360)

/** Distance at which a w x h rectangle fills at most the given share of each axis. */
function fitDistance(w: number, h: number, aspect: number, wFrac: number, hFrac: number): number {
  return Math.max(w / wFrac / (2 * HALF_TAN * aspect), h / hFrac / (2 * HALF_TAN))
}

/**
 * The assembled device's world size, measured, not taken from
 * REFERENCE_BOUNDS, which does not match the shipped model (A41). Measured per
 * rig, so the placeholder and the glTF each frame by their own size. Leaves the
 * rig at seek(0), its construction state.
 */
export function assembledSize(rig: AssemblyRig): DeviceSize {
  rig.seek(1)
  rig.root.updateMatrixWorld(true)
  const size = new Box3().setFromObject(rig.root, true).getSize(new Vector3())
  rig.seek(0)
  rig.root.updateMatrixWorld(true)
  return { x: size.x, y: size.y }
}

// Scratch vectors, reused every frame so the scrub allocates nothing.
const basePos = new Vector3()
const baseTarget = new Vector3()
const finalPos = new Vector3()

/**
 * Camera position and look target for a scroll progress. Pure: no state is
 * carried between calls.
 *
 * Desktop: aims left of the device, which pushes the device into the right
 * two-thirds and leaves the left third for copy. Unchanged from before this
 * module existed.
 *
 * Mobile: the device keeps the top of the screen at full strength and the copy
 * gets the bottom band. The distance fits the ASSEMBLED device into
 * MOBILE_DEVICE_*_FRACTION of the viewport. Then the camera AND its target move
 * down by the same world amount, so the subject sits MOBILE_LIFT above centre
 * while the view stays square to the axis.
 *
 * Not `camera.setViewOffset`: drei's `<Html transform>` builds its CSS
 * projection from the fov term alone and ignores the off-axis terms (C1). The
 * LCD would move and the typed-input overlay would not.
 */
export function cameraPose(
  progress: number,
  v: Viewport,
  anchor: Vector3,
  device: DeviceSize,
  out: CameraPose,
): CameraPose {
  const aspect = v.width / Math.max(v.height, 1)
  const t = smoothstep(subProgress(progress, CAMERA_PUSH))

  if (v.desktop) {
    basePos.set(0, 0, BASE_DISTANCE)
    baseTarget.set(-B.x * 0.55, 0, 0)
  } else {
    basePos.set(
      0,
      0,
      fitDistance(device.x, device.y, aspect, MOBILE_DEVICE_WIDTH_FRACTION, MOBILE_DEVICE_HEIGHT_FRACTION),
    )
    baseTarget.set(0, 0, 0)
  }

  finalPos.copy(anchor)
  finalPos.z += fitDistance(PANEL_WIDTH, PANEL_HEIGHT, aspect, PANEL_WIDTH_FRACTION, PANEL_HEIGHT_FRACTION)

  out.position.lerpVectors(basePos, finalPos, t)
  out.target.lerpVectors(baseTarget, anchor, t)

  if (!v.desktop) {
    const lift = MOBILE_LIFT * (out.position.z - out.target.z) * HALF_TAN
    out.position.y -= lift
    out.target.y -= lift
  }
  return out
}
```

If Task 2 Step 6 changed `PANEL_HEIGHT_FRACTION` to `0.36`, use `0.36` here.

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm test src/three/framing.test.ts`
Expected: PASS for both rigs. For reference, a pre-plan script on the glTF rig measured mobile NDC y −0.102…0.940 and x ±0.82, with the anchor at y 0.420 on both phones.

If a placeholder case fails, don't change the thresholds. Report the failing numbers: the placeholder's scatter may need Phase B attention.

- [ ] **Step 6: Wire it into `Experience.tsx`**

1. Delete the local `CAMERA_PUSH`, `BASE_POS`, `PANEL_WIDTH`, `PANEL_HEIGHT`, `PANEL_*_FRACTION` and `baseTarget` definitions and their comments (lines ~21-71). Keep `FADE_STAGE_FOUR`, and import `CAMERA_PUSH` from framing for `pinStageFive`.
2. Change the imports:

```tsx
import { Vector3 } from 'three'
import {
  CAMERA_PUSH,
  FOV,
  BASE_DISTANCE,
  assembledSize,
  cameraPose,
  type CameraPose,
} from '@/three/framing'
```

   Remove `Object3D`/`PerspectiveCamera` only if they become unused (`Object3D` is still used by `panelRef`). Remove `REFERENCE_BOUNDS as B` from the types import if it becomes unused.

3. In `DeviceScene`, replace `finalPos`, `pos`, `target` and `base` with:

```tsx
  // Measured once per rig: the assembled box, so the mobile fit uses the real
  // model's size rather than REFERENCE_BOUNDS (A41).
  const device = useMemo(() => assembledSize(rig), [rig])
  const pose = useRef<CameraPose>({ position: new Vector3(), target: new Vector3() })
```

4. Replace the body of `frame()` with:

```tsx
  function frame(progress: number) {
    progressRef.current = progress
    rig.seek(progress)
    rig.root.updateMatrixWorld(true)
    rig.displayAnchor.getWorldPosition(anchor.current)

    cameraPose(
      progress,
      { width: size.width, height: size.height, desktop },
      anchor.current,
      device,
      pose.current,
    )
    camera.position.copy(pose.current.position)
    camera.lookAt(pose.current.target)

    pinStageFive(progress)
    fadeStageFour(progress)
  }
```

5. In `CANVAS_PROPS`:
   - set `camera: { position: [0, 0, BASE_DISTANCE] as [number, number, number], fov: FOV, near: 10, far: 10000 }`;
   - remove `dpr`, and pass it per branch on both `<Canvas>` elements instead: `dpr={desktop ? [1, 2] : [1, 1.75]}`. That caps retina cost on phones, where the in-app webviews are the weakest browsers the site meets (spec §3).
6. Remove `className={desktop ? undefined : 'dim-device'}` from the scrub `<Canvas>`, and delete the comment block about dimming above it.
7. In the reduced-motion branch, change `className="pointer-events-none fixed inset-0 opacity-30 md:opacity-100"` to `className="pointer-events-none fixed inset-0"` (A43).
8. In `globals.css`, delete the `.dim-device canvas { … }` rule and its comment.

- [ ] **Step 7: Check in the browser**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

With `pnpm dev`, in Chrome DevTools, emulate 390×844 (mobile):
- p=0: the device (or its incoming parts) is in the top half at full opacity;
- scroll to the end: the LCD sits at ~29% from the top, the typed-input overlay is on the LCD, and typing works.

At 1440×900 desktop the framing is unchanged from Task 2's screenshot. Take screenshots of each.

- [ ] **Step 8: Commit**

```bash
git add src/test/load-glb.ts src/test/project.ts src/three/framing.ts src/three/framing.test.ts src/components/Experience.tsx src/app/globals.css
git commit -m "Framing module: device in the top band on phones, tested against the real GLB"
```

---

### Task 4: Mobile copy band, svh, safe areas, credits line and viewport

**Files:**
- Modify: `src/components/Overlay.tsx` (the `<section>` className), `src/components/Experience.tsx` (the `<main>` className in the scrub branch), `src/components/Credits.tsx` (whole file), `src/content/credits.ts`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: the Task 1 tokens; the Task 2 `Overlay`.
- Produces: `Credit.modified?: string` in `@/content/credits`.

- [ ] **Step 1: Bottom-align the section copy on mobile, and switch to svh**

In `Overlay.tsx`, replace the `<section>` `className` expression with:

```tsx
            className={`relative isolate flex h-svh w-screen px-6 sm:px-10 lg:px-16 ${
              // Mobile: copy in the bottom band, above the credits and the
              // home indicator; the device owns the top ~58% (framing.ts).
              // Desktop: centred beside the device; section 5 sits above the
              // panel because at full push the panel fills the middle.
              'items-end pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0'
            } ${isLast ? 'md:items-start md:pt-[7svh]' : 'md:items-center'} ${
              // The band's backdrop: a hairline at the band's top edge and a
              // ground fade, so a part flying behind the copy mid-scrub never
              // costs legibility. `isolate` keeps the -z-10 pseudo inside
              // this section instead of dropping behind the canvas.
              "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:-z-10 before:h-[44svh] before:border-t before:border-rule before:bg-linear-to-t before:from-ground/92 before:via-ground/80 before:to-transparent before:content-[''] md:before:hidden"
            }`}
```

Why `svh`: `vh` is the large viewport, so while toolbars are visible the bottom of a `100vh` box sits under them and would hide the copy band. `svh` always fits the visible area (D1).

In `Experience.tsx` (scrub branch), change `<main className="h-screen w-screen">` to `<main className="h-svh w-screen">`.

- [ ] **Step 2: Add the licence modification notice and restyle the credits**

In `src/content/credits.ts`, add to `interface Credit`:

```ts
  /**
   * CC BY 4.0 §3(a)(1)(B): say if the work was modified. The GLB is the
   * download regrouped into five animation sets by tools/build_device_glb.py.
   */
  modified?: string
```

and add `modified: 'regrouped for animation',` to the `'C4 bomb | CS2'` entry.

Replace the `return (…)` of `Credits.tsx` with:

```tsx
  return (
    <aside
      aria-label="Attribution"
      // Full-width strip in the bottom safe area. The copy band's bottom
      // padding (Overlay, 5rem) reserves this strip's height, so they never
      // overlap. Wraps on phones: two nowrap credits overflowed 360px.
      className="fixed inset-x-0 bottom-0 z-10 bg-ground/85 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-[2px] sm:px-10 lg:px-16"
    >
      <p className="font-mono text-[10px] leading-relaxed text-muted">
        {CREDITS.map((credit, i) => (
          <span key={credit.title} className="sm:whitespace-nowrap">
            {i > 0 && <span aria-hidden="true" className="mx-2 text-rule">·</span>}
            {credit.href ? (
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-2 hover:text-ink"
              >
                {credit.title}
              </a>
            ) : (
              <span>{credit.title}</span>
            )}
            <span> by {credit.author}, </span>
            <a
              href={credit.licenceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rule underline-offset-2 hover:text-ink"
            >
              {credit.licence}
            </a>
            {credit.modified && <span>, {credit.modified}</span>}
          </span>
        ))}
      </p>
    </aside>
  )
```

Update the component's doc comment: remove the sentence about the scrim over pale tan at full push, and say the strip sits in the bottom safe area on a light ground.

- [ ] **Step 3: Viewport export**

Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md` first. Then in `layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'

// themeColor tints mobile browser chrome and in-app toolbars to the page
// ground. viewportFit=cover lets the safe-area insets in Overlay and Credits
// take effect. No interactive-widget: it does not reach Android in-app
// webviews (D2); the keyboard is handled in code (scroll-freeze).
export const viewport: Viewport = {
  themeColor: '#F5F5F2',
  viewportFit: 'cover',
}
```

- [ ] **Step 4: Verify the layout**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

In Chrome DevTools at 390×844 and 360×780, at scroll progress 0, 0.3, 0.5, 0.7, 0.82, 0.84, 0.86, 0.9 and 1.0:
- the copy sits in the bottom band;
- the credits never overlap the copy;
- sections 4 and 5 never overlap each other (0.82–0.86);
- this evaluates to `true`: `document.documentElement.scrollWidth === innerWidth`.

At 1440×900 the desktop layout matches the Task 2 screenshot. Record the frames.

- [ ] **Step 5: Commit**

```bash
git add src/components/Overlay.tsx src/components/Experience.tsx src/components/Credits.tsx src/content/credits.ts src/app/layout.tsx
git commit -m "Mobile copy band on svh with safe areas, credits strip, theme colour"
```

---

### Task 5: Freeze scroll progress while the LCD input is focused

**Files:**
- Create: `src/lib/scroll-freeze.ts`, `src/lib/scroll-freeze.test.ts`
- Modify: `src/components/DisplayPanel.tsx` (props, the shell `div`, the input), `src/components/Experience.tsx` (`DeviceScene`)

**Interfaces:**
- Produces (from `@/lib/scroll-freeze`):
  - `type Freeze = { kind: 'free' } | { kind: 'held'; at: number } | { kind: 'releasing'; at: number; frames: number }`;
  - `type FreezeEvent = { type: 'focus'; progress: number } | { type: 'blur' } | { type: 'userScroll' }`;
  - `FREE: Freeze`, `RELEASE_EPSILON = 0.002`, `RELEASE_MAX_FRAMES = 120`;
  - `reduceFreeze(state: Freeze, event: FreezeEvent): Freeze`;
  - `progressFor(state: Freeze, live: number): { progress: number; state: Freeze }`;
  - `scrollTopFor(fraction: number, scrollHeight: number, clientHeight: number): number`.
- Produces (from `DisplayPanel`): the prop `onFocusChange?: (focused: boolean) => void`, and the attribute `data-display-panel` on the shell div.

- [ ] **Step 1: Write the failing tests**

`src/lib/scroll-freeze.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  FREE,
  RELEASE_MAX_FRAMES,
  progressFor,
  reduceFreeze,
  scrollTopFor,
  type Freeze,
} from '@/lib/scroll-freeze'

describe('scroll freeze', () => {
  it('free passes live progress through', () => {
    expect(progressFor(FREE, 0.42)).toEqual({ progress: 0.42, state: FREE })
  })

  it('focus holds the progress at focus time, whatever live does', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    // Keyboard resize: ScrollControls' offset jumps to ~0.59 (C17).
    expect(progressFor(held, 0.59)).toEqual({ progress: 0.93, state: held })
  })

  it('blur moves to releasing, which holds until live comes back within epsilon', () => {
    let s: Freeze = reduceFreeze(reduceFreeze(FREE, { type: 'focus', progress: 0.93 }), { type: 'blur' })
    expect(s).toEqual({ kind: 'releasing', at: 0.93, frames: 0 })
    let r = progressFor(s, 0.7)
    expect(r.progress).toBe(0.93)
    s = r.state
    r = progressFor(s, 0.9295)
    expect(r).toEqual({ progress: 0.9295, state: FREE })
  })

  it('Review Focus 2: a restore that never converges releases after RELEASE_MAX_FRAMES', () => {
    let s: Freeze = { kind: 'releasing', at: 0.93, frames: 0 }
    for (let i = 0; i < RELEASE_MAX_FRAMES; i++) {
      const r = progressFor(s, 0.5)
      expect(r.progress).toBe(0.93)
      s = r.state
    }
    expect(progressFor(s, 0.5)).toEqual({ progress: 0.5, state: FREE })
  })

  it('Review Focus 1: user scroll while held frees immediately (the caller must not restore)', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    expect(reduceFreeze(held, { type: 'userScroll' })).toEqual(FREE)
    // and the blur that follows the programmatic blur is a no-op
    expect(reduceFreeze(FREE, { type: 'blur' })).toEqual(FREE)
  })

  it('refocus while held keeps the original hold', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    expect(reduceFreeze(held, { type: 'focus', progress: 0.6 })).toBe(held)
  })

  it('Review Focus 2: scrollTopFor maps a fraction onto the CURRENT scroll length', () => {
    expect(scrollTopFor(0.93, 4220, 844)).toBeCloseTo(0.93 * (4220 - 844), 9)
    // after rotating to landscape the same fraction lands on the new length
    expect(scrollTopFor(0.93, 1950, 390)).toBeCloseTo(0.93 * (1950 - 390), 9)
    expect(scrollTopFor(1.4, 1000, 400)).toBe(600)
    expect(scrollTopFor(-1, 1000, 400)).toBe(0)
    expect(scrollTopFor(0.5, 300, 400)).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/lib/scroll-freeze.test.ts`
Expected: FAIL, unresolved import.

- [ ] **Step 3: Implement**

`src/lib/scroll-freeze.ts`:

```ts
/**
 * Holds scroll progress while the display's input is focused.
 *
 * Android in-app webviews (Instagram, TikTok) are resized by the host app when
 * the keyboard opens, and no viewport meta reaches them (D2). R3F then resizes
 * the canvas; ScrollControls keeps scrollTop in px, so on the next scroll event
 * the offset jumps, e.g. from 0.93 to ~0.59 (C17). That is below
 * DISPLAY_LIVE_AT, so the display goes dark while the visitor is typing.
 *
 * - focus: hold the progress at focus time.
 * - blur: the caller restores scrollTop to the held fraction of the NEW scroll
 *   length, and progress stays held until the live offset has damped back to
 *   within RELEASE_EPSILON, or RELEASE_MAX_FRAMES pass. The cap keeps a restore
 *   that cannot converge (clamped scroll) from freezing the page.
 * - userScroll (touchmove/wheel outside the panel): the visitor is navigating
 *   away. Free immediately, with no restore, or we would fight their scroll.
 */
export type Freeze =
  | { kind: 'free' }
  | { kind: 'held'; at: number }
  | { kind: 'releasing'; at: number; frames: number }

export type FreezeEvent =
  | { type: 'focus'; progress: number }
  | { type: 'blur' }
  | { type: 'userScroll' }

export const FREE: Freeze = { kind: 'free' }
export const RELEASE_EPSILON = 0.002
/** ~2s at 60fps: comfortably longer than ScrollControls' damping of 0.25 needs. */
export const RELEASE_MAX_FRAMES = 120

export function reduceFreeze(state: Freeze, event: FreezeEvent): Freeze {
  switch (event.type) {
    case 'focus':
      return state.kind === 'held' ? state : { kind: 'held', at: event.progress }
    case 'blur':
      return state.kind === 'held' ? { kind: 'releasing', at: state.at, frames: 0 } : state
    case 'userScroll':
      return FREE
  }
}

/** The progress to render this frame, and the state to carry into the next. */
export function progressFor(state: Freeze, live: number): { progress: number; state: Freeze } {
  if (state.kind === 'free') return { progress: live, state }
  if (state.kind === 'held') return { progress: state.at, state }
  if (Math.abs(live - state.at) < RELEASE_EPSILON || state.frames >= RELEASE_MAX_FRAMES) {
    return { progress: live, state: FREE }
  }
  return { progress: state.at, state: { ...state, frames: state.frames + 1 } }
}

/** scrollTop that puts ScrollControls at `fraction` of the current scroll length. */
export function scrollTopFor(fraction: number, scrollHeight: number, clientHeight: number): number {
  const f = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction
  return f * Math.max(0, scrollHeight - clientHeight)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/lib/scroll-freeze.test.ts`
Expected: PASS.

- [ ] **Step 5: Report focus from `DisplayPanel`**

- Add `onFocusChange` to the props type and destructuring:
  ```tsx
    /** Focus on the address input, so the scene can hold scroll progress
     *  while a keyboard resizes the viewport. See lib/scroll-freeze. */
    onFocusChange?: (focused: boolean) => void
  ```
- Add `data-display-panel=""` to the shell `<div ref={shellRef} …>`.
- On the `<input>`, add:
  ```tsx
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
  ```

- [ ] **Step 6: Wire the freeze in `DeviceScene`**

Add imports:

```tsx
import { useCallback } from 'react'
import { FREE, progressFor, reduceFreeze, scrollTopFor, type Freeze } from '@/lib/scroll-freeze'
```

(Merge `useCallback` into the existing `react` import.)

Inside `DeviceScene`, after `progressRef`:

```tsx
  // See lib/scroll-freeze: holds progress while the address input is focused,
  // so a keyboard-driven resize cannot drop the display below DISPLAY_LIVE_AT.
  const freeze = useRef<Freeze>(FREE)

  const onFocusChange = useCallback(
    (focused: boolean) => {
      if (!scrub) return
      if (focused) {
        freeze.current = reduceFreeze(freeze.current, { type: 'focus', progress: progressRef.current })
        return
      }
      const before = freeze.current
      freeze.current = reduceFreeze(before, { type: 'blur' })
      if (before.kind === 'held') {
        const el = scroll.el
        el.scrollTop = scrollTopFor(before.at, el.scrollHeight, el.clientHeight)
      }
    },
    [scroll, scrub],
  )

  // A touch or wheel outside the panel while held is the visitor navigating
  // away: free, blur, and do NOT restore (Review Focus 1). Touches inside the
  // panel are caret moves and selection, and are ignored.
  useEffect(() => {
    if (!scrub) return
    const el = scroll.el
    const onUser = (event: Event) => {
      if (freeze.current.kind !== 'held') return
      if ((event.target as Element | null)?.closest?.('[data-display-panel]')) return
      freeze.current = reduceFreeze(freeze.current, { type: 'userScroll' })
      ;(document.activeElement as HTMLElement | null)?.blur()
    }
    el.addEventListener('touchmove', onUser, { passive: true })
    el.addEventListener('wheel', onUser, { passive: true })
    return () => {
      el.removeEventListener('touchmove', onUser)
      el.removeEventListener('wheel', onUser)
    }
  }, [scroll, scrub])
```

Replace `useFrame(() => { if (scrub) frame(scroll.offset) })` with:

```tsx
  useFrame(() => {
    if (!scrub) return
    const next = progressFor(freeze.current, scroll.offset)
    freeze.current = next.state
    frame(next.progress)
  })
```

In the existing dev-only `__rig` effect, add:

```tsx
      ;(globalThis as unknown as { __progress?: () => number }).__progress = () =>
        progressRef.current
```

Pass the callback: `<DisplayPanel progress={progressRef} occludeAgainst={panelRef} onFocusChange={onFocusChange} />`.

- [ ] **Step 7: Verify in DevTools**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

With `pnpm dev`, in Chrome DevTools, emulate 390×844, scroll to the end, and click the LCD input. Evaluate `__progress()` and record it (expect ≈ 1). Then emulate 390×544 (−300 px) and scroll the drei container by 1 px programmatically (`el.scrollTop += 1`) so ScrollControls recomputes. Checks:
- `__progress()` is unchanged, and the display is still lit (the shell's `opacity` is `1`).
- Blur the input by pressing Escape or tabbing out. Within 2 s, `__progress()` is back within 0.002 of the recorded value.
- Focus again, then dispatch a `wheel` event on the drei scroller (`el.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))`). The input blurs and `__progress()` follows the live scroll.

Record the numbers.

- [ ] **Step 8: Commit**

```bash
git add src/lib/scroll-freeze.ts src/lib/scroll-freeze.test.ts src/components/DisplayPanel.tsx src/components/Experience.tsx
git commit -m "Hold scroll progress while the LCD input is focused, so a webview keyboard cannot dark the display"
```

---

### Task 6: Studio lighting and the back-wall contact shadow

**Files:**
- Create: `src/three/shadow.ts`, `src/three/shadow.test.ts`, `src/three/StudioLighting.tsx`
- Modify: `src/components/Experience.tsx` (delete `Lighting`, mount `StudioLighting` in `DeviceScene`)

**Interfaces:**
- Consumes: the Task 3 `cameraPose`, `assembledSize`, `CameraPose`, `Viewport`, `loadGlbGeometry`, `makeCamera`.
- Produces:
  - from `@/three/shadow`: `interface BackWallShadow { z: number; far: number; scale: number; opacity: number; blur: number; resolution: number }`, `BACK_WALL_SHADOW: BackWallShadow`, `SHADOW_ROTATION: [number, number, number]`, and `peakAlpha(nearestZ: number, s: BackWallShadow): number`;
  - from `@/three/StudioLighting`: `StudioLighting({ progress?: RefObject<number> })`.

- [ ] **Step 1: Write the failing shadow-geometry test**

`src/three/shadow.test.ts`:

```ts
import { join } from 'node:path'
import { Box3, Vector3, type Mesh } from 'three'
import { describe, expect, it } from 'vitest'

import { createGltfRig } from '@/three/assembly/gltf-rig'
import { createPlaceholderRig } from '@/three/assembly/placeholder-rig'
import type { AssemblyRig } from '@/three/assembly/types'
import { assembledSize, cameraPose, type CameraPose, type Viewport } from '@/three/framing'
import { BACK_WALL_SHADOW as S, peakAlpha } from '@/three/shadow'
import { loadGlbGeometry } from '@/test/load-glb'
import { makeCamera } from '@/test/project'

const RIGS: [string, () => AssemblyRig][] = [
  ['glTF', () => createGltfRig(loadGlbGeometry(join(process.cwd(), 'public/models/c4-device.glb')))],
  ['placeholder', () => createPlaceholderRig()],
]
const VIEWS: Viewport[] = [
  { width: 360, height: 780, desktop: false },
  { width: 390, height: 844, desktop: false },
  { width: 768, height: 1024, desktop: true },
  { width: 1440, height: 900, desktop: true },
  { width: 1680, height: 720, desktop: true },
  { width: 1920, height: 1080, desktop: true },
]
const STEPS = 100

/** Extremes of every vertex that is on screen at some pose, over the whole scrub. */
function inFrameExtremes(rig: AssemblyRig) {
  const device = assembledSize(rig)
  const pose: CameraPose = { position: new Vector3(), target: new Vector3() }
  const w = new Vector3(), n = new Vector3(), a = new Vector3()
  let minZ = Infinity, maxAbsX = 0, maxAbsY = 0
  for (const v of VIEWS) {
    for (let k = 0; k <= STEPS; k++) {
      const p = k / STEPS
      rig.seek(p)
      rig.root.updateMatrixWorld(true)
      rig.displayAnchor.getWorldPosition(a)
      const cam = makeCamera(cameraPose(p, v, a, device, pose), v)
      rig.root.traverse((node) => {
        const mesh = node as Mesh
        if (!mesh.isMesh) return
        const pos = mesh.geometry.attributes.position
        for (let i = 0; i < pos.count; i++) {
          w.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
          n.copy(w).project(cam)
          if (Math.abs(n.x) > 1 || Math.abs(n.y) > 1 || Math.abs(n.z) > 1) continue
          minZ = Math.min(minZ, w.z)
          maxAbsX = Math.max(maxAbsX, Math.abs(w.x))
          maxAbsY = Math.max(maxAbsY, Math.abs(w.y))
        }
      })
    }
  }
  rig.seek(1)
  rig.root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(rig.root, true)
  return { minZ, maxAbsX, maxAbsY, backZ: box.min.z, frontZ: box.max.z }
}

describe.each(RIGS)('%s rig: back-wall shadow geometry (spec §3)', (_name, make) => {
  const e = inFrameExtremes(make())
  const need = `needs z < ${e.minZ.toFixed(1)}, far >= ${(e.frontZ - S.z).toFixed(1)} and >= ${(2 * (e.backZ - S.z)).toFixed(1)}, scale >= ${(2 * Math.max(e.maxAbsX, e.maxAbsY)).toFixed(1)}`

  it(`1. no on-screen vertex is ever behind the plane (${need})`, () => {
    expect(S.z).toBeLessThan(e.minZ)
  })

  it(`2. the assembled device's peak alpha is >= 0.5 (${need})`, () => {
    expect(peakAlpha(e.backZ, S)).toBeGreaterThanOrEqual(0.5)
  })

  it(`3. every on-screen vertex projects inside the plane (${need})`, () => {
    expect(Math.max(e.maxAbsX, e.maxAbsY)).toBeLessThanOrEqual(S.scale / 2)
  })

  it(`4. the plane's depth range reaches the device's front face (${need})`, () => {
    expect(S.z + S.far).toBeGreaterThanOrEqual(e.frontZ)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/three/shadow.test.ts`
Expected: FAIL, unresolved import `@/three/shadow`.

- [ ] **Step 3: Implement `shadow.ts`**

The values come from a pre-plan run of the same measurement on the glTF rig: min on-screen z −139.29 (the casing at p=0 on 360×780), max |x| 323.0, max |y| 390.1, back face −39.41, front face +39.41.

```ts
/**
 * The back-wall contact shadow (spec §3).
 *
 * drei's ContactShadows renders the scene orthographically from its plane and
 * paints `1 - depth/far` (C19), so a plane far behind the device gives an
 * invisible halo. drei's own rotation makes it a floor; a user `rotation`
 * replaces that, and [0, π, 0] makes it project along world +z, toward the
 * camera (C14, C15).
 *
 * The numbers are measured, not tuned: src/three/shadow.test.ts replays the
 * whole scrub at six viewports for both rigs and fails with the required
 * values if any of its four criteria stops holding. Measured on the glTF rig:
 * the deepest on-screen vertex is z -139.29 and on-screen |x|,|y| reach
 * 323.0/390.1 mm.
 */
export interface BackWallShadow {
  /** plane position on z, mm */
  z: number
  /** depth range of the shadow camera, mm */
  far: number
  /** plane edge length, mm (square) */
  scale: number
  opacity: number
  blur: number
  resolution: number
}

export const BACK_WALL_SHADOW: BackWallShadow = {
  z: -150,
  far: 230,
  scale: 800,
  opacity: 0.3,
  blur: 2.5,
  resolution: 256,
}

export const SHADOW_ROTATION: [number, number, number] = [0, Math.PI, 0]

/** Shadow alpha, before `opacity`, of the surface nearest the plane. */
export function peakAlpha(nearestZ: number, s: BackWallShadow): number {
  return 1 - (nearestZ - s.z) / s.far
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/three/shadow.test.ts`
Expected: PASS for the glTF rig. The glTF peak alpha is 1 − 110.59/230 = 0.519.

If the **placeholder** rows fail, each test name prints the numbers it needs. Move `z`, `far` and `scale` outward to satisfy both rigs: z lower, far and scale higher, with `far ≥ 2·(backZ − z)` still holding. Re-run until everything passes, and update the doc comment's measured values.

- [ ] **Step 5: Write `StudioLighting.tsx`**

First read `node_modules/@react-three/drei/core/Lightformer.js` and `core/Environment.js` to confirm the `target`, `form`, `scale` and `intensity` props, and that `Environment` accepts children with `frames` and `resolution`.

```tsx
'use client'

import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'

import { BACK_WALL_SHADOW as S, SHADOW_ROTATION } from '@/three/shadow'

/**
 * A light studio, rendered locally: two soft Lightformer panels (a key above
 * and to the right, a fill on the left) baked into an environment map, plus one
 * directional key for form. No `files`/`preset`, so nothing is downloaded
 * (C13). The env's cube camera has far=1000, so every panel sits within
 * 1000 mm of the origin.
 *
 * Replaces the old olive ambient and brass bounce, which were tuned for an
 * olive-black ground.
 */
export function StudioLighting({ progress }: { progress?: RefObject<number> }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[260, 320, 420]} scale={[420, 260, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[-420, 60, 300]} scale={[260, 420, 1]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[0.5, 0.6, 0.7]} intensity={1.6} />
      <BackWallShadow progress={progress} />
    </>
  )
}

/**
 * Re-renders only while the assembly is moving.
 *
 * drei's default `frames={Infinity}` re-renders the whole scene with an
 * override material every frame (C19). Its frame counter is a plain `let`
 * inside the component body, so any re-render resets it. `moving` flips to
 * false when progress stops changing, and that re-render paints exactly one
 * more frame at the resting pose. It flips back the moment progress moves.
 */
function BackWallShadow({ progress }: { progress?: RefObject<number> }) {
  const last = useRef<number | null>(null)
  const [moving, setMoving] = useState(true)

  useFrame(() => {
    const p = progress?.current ?? 1
    const changed = last.current === null || Math.abs(p - last.current) > 1e-5
    last.current = p
    if (changed !== moving) setMoving(changed)
  })

  return (
    <ContactShadows
      position={[0, 0, S.z]}
      rotation={SHADOW_ROTATION}
      scale={S.scale}
      far={S.far}
      opacity={S.opacity}
      blur={S.blur}
      resolution={S.resolution}
      frames={moving ? Infinity : 1}
    />
  )
}
```

- [ ] **Step 6: Mount it**

In `Experience.tsx`:
- Delete the `Lighting` function and both `<Lighting />` usages.
- Import `StudioLighting` from `@/three/StudioLighting`.
- In `DeviceScene`'s returned fragment, add `<StudioLighting progress={progressRef} />` before `<primitive object={rig.root} />`.

- [ ] **Step 7: Tune by eye and check the shadow's orientation**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

With `pnpm dev` at 1440×900:
- **p=1:** the device reads as lit, not flat. The tape and capacitor tops show soft highlights, and a soft halo sits behind the device.
- **p=0.3:** a charge is still flying in from the right, and its shadow must be **behind that charge**, not mirrored to the left. If it's mirrored, change `SHADOW_ROTATION` to `[Math.PI, 0, 0]`, since both orientations project along +z (C15). Re-run the tests and re-check.

If the device reads too dark or too washed out, adjust only the Lightformer and directional `intensity` values. Take before/after screenshots at p = 0.3 and 1.0.

- [ ] **Step 8: Commit**

```bash
git add src/three/shadow.ts src/three/shadow.test.ts src/three/StudioLighting.tsx src/components/Experience.tsx
git commit -m "Studio lighting from local Lightformers, and a measured back-wall contact shadow"
```

---

### Task 7: The ARM button's tap target

**Files:**
- Modify: `src/components/DisplayPanel.tsx` (the submit `<button>` className)

**Interfaces:** none new.

- [ ] **Step 1: Measure the current target**

With `pnpm dev`, in DevTools at 360×780 (the smallest phone, so the smallest on-screen scale), scroll to the end and evaluate:

```js
const b = document.querySelector('#arm-email').closest('form').querySelector('button').getBoundingClientRect()
;({ w: b.width, h: b.height })
```

Record it. Expected: well under 44 in at least one dimension.

- [ ] **Step 2: Add a centred 42 CSS px hit area**

On-screen size = CSS px × (14.6/40) × projection. At full push the 240 px shell fills 72% of the width, so at 360 px the scale is 0.72·360/240 = 1.08. A 42 CSS px box is therefore ≥ 45 screen px on every phone ≥ 360 wide, and 44 is the WCAG AAA / Apple size (D3).

Add these classes to the `<button>` (keep the existing ones):

```
relative before:absolute before:left-1/2 before:top-1/2 before:h-[42px] before:w-[max(100%,42px)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']
```

and add the comment:

```tsx
              // The visible button stays small; the ::before is a centred
              // 42 CSS px hit box, which is >= 44 screen px at full push on
              // any phone >= 360 wide (Html scale 14.6/40 x projection).
```

- [ ] **Step 3: Verify the hit area on screen**

At 360×780, full push, evaluate:

```js
const btn = document.querySelector('#arm-email').closest('form').querySelector('button')
const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
;[[0, -22], [0, 22], [-22, 0], [22, 0]].map(([dx, dy]) => btn.contains(document.elementFromPoint(cx + dx, cy + dy)))
```

Expected: `[true, true, true, true]`. Also confirm that typing in the input still works and clicking the input doesn't trigger submit.

- [ ] **Step 4: Commit**

```bash
git add src/components/DisplayPanel.tsx
git commit -m "ARM button: 44px on-screen hit area on phones"
```

---

### Task 8: Restyle `/subscribed`

**Files:**
- Modify: `src/app/subscribed/page.tsx:44-70` (the returned JSX only; `COPY`, `toState` and `metadata` are unchanged)

**Interfaces:** consumes the Task 1 tokens only.

- [ ] **Step 1: Replace the returned JSX**

```tsx
  return (
    // Mobile: the block sits in the bottom band, like the landing page.
    // Desktop: vertically centred. No 3D: this page must load instantly.
    <main className="flex min-h-svh items-end px-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] sm:px-10 md:items-center md:pb-0 lg:px-16">
      <div className="max-w-[40ch]">
        <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
          <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
          {eyebrow}
        </p>

        <h1 className="h-display text-[clamp(2.25rem,8vw,3.5rem)] text-ink">{heading}</h1>

        <p className="mt-5 text-[17px] leading-[1.55] text-muted md:text-lg">{body}</p>

        <p className="mt-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-base text-signal-ink underline decoration-signal underline-offset-4 hover:text-ink"
          >
            Back to the device
          </Link>
        </p>
      </div>
    </main>
  )
```

`uppercase` renders the existing eyebrow strings (`Confirmed`, `Link expired`, `Link not valid`) as `CONFIRMED` and so on. The strings themselves don't change. `min-h-11` is 44 px.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

In DevTools, open `/subscribed`, `/subscribed?state=expired` and `/subscribed?state=invalid` at 390×844 and 1440×900. Check that the label, heading and body are styled, the link is orange and underlined, and its height is ≥ 44 (`getBoundingClientRect().height`). Take screenshots.

- [ ] **Step 3: Commit**

```bash
git add src/app/subscribed/page.tsx
git commit -m "Light studio /subscribed"
```

---

### Task 9: The confirmation email

**Files:**
- Modify: `src/emails/confirm-address.tsx` (header comment, `COLORS`, styles; **no string changes**)
- Create: `src/lib/consent-email.test.ts`

**Interfaces:**
- Consumes:
  - `renderConsentEmail(confirmUrl: string): Promise<{ subject: string; html: string; text: string }>` from `@/lib/consent-email`;
  - `PALETTE` from `@/content/palette`.

The spec's example strip label `ADDRESS · PENDING` would be a copy change, so the existing strip text (`status` / `NOT ARMED`) stays. This follows the frozen-copy constraint.

- [ ] **Step 1: Write the failing test**

`src/lib/consent-email.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { renderConsentEmail } from '@/lib/consent-email'

const URL_ = 'https://example.test/api/confirm?t=abc.def'

describe('confirmation email', async () => {
  const { html, text } = await renderConsentEmail(URL_)

  it('the button is signal-ink with white text', () => {
    const anchor = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
      .map((m) => m[0])
      .find((a) => a.includes('Arm subscription'))
    expect(anchor).toBeDefined()
    expect(anchor).toMatch(/background-color:\s*#C73E00/i)
    expect(anchor).toMatch(/[;"]\s*color:\s*#FFFFFF/i)
    expect(anchor).toContain(`href="${URL_.replace(/&/g, '&amp;')}"`)
  })

  it('uses the light palette and none of the old one', () => {
    expect(html).toMatch(/#F5F5F2/i)
    for (const old of ['#12140f', '#1f2319', '#8a6e3b', '#c8862a', '#d8d4c6']) {
      expect(html.toLowerCase()).not.toContain(old)
    }
  })

  it('keeps the email constraints: no images, no classes, no <style>', () => {
    expect(html).not.toMatch(/<img\b/i)
    expect(html).not.toMatch(/\sclass="/i)
    expect(html).not.toMatch(/<style\b/i)
  })

  it('the plain-text part carries the link', () => {
    expect(text).toContain(URL_)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/lib/consent-email.test.ts`
Expected: FAIL on the button colour and the old-palette checks. The constraints test and the text test should already pass.

If the file fails to *load* on JSX, add `esbuild: { jsx: 'automatic' }` to `vitest.config.ts` (or `oxc: { jsx: { runtime: 'automatic' } }` if the installed Vitest's Vite is 8+) and re-run.

- [ ] **Step 3: Restyle the email**

In `confirm-address.tsx`:

1. Replace the header comment's first paragraph with:

```tsx
 * Light studio, matching the landing page: an off-white ground, a white card,
 * near-black type, the page's signal orange for the one action. One dark LCD
 * strip is kept as the single echo of the device. Deliberately carries no
 * third-party game trademarks, logos, or in-game lines.
```

   Keep the "Email is not the browser" section as it is.

2. Replace `COLORS` with the following (import `PALETTE` from `@/content/palette`):

```tsx
const COLORS = {
  ground: PALETTE.ground,
  card: '#FFFFFF',
  rule: PALETTE.rule,
  ink: PALETTE.ink,
  muted: PALETTE.muted,
  signalInk: PALETTE.signalInk,
  lcd: PALETTE.lcd,
  armed: PALETTE.armed,
}
```

3. Change styles only:
   - **`Body`:** `backgroundColor: COLORS.ground`.
   - **The warning-tape `<Section>`:** delete it, including its comment. It was the military stripe.
   - **Housing `<Section>`:** becomes the card: `backgroundColor: COLORS.card`, `padding: '30px 28px 34px'`, `border: \`1px solid ${COLORS.rule}\``, `borderRadius: '6px'`.
   - **Eyebrow `Text`:** `color: COLORS.signalInk`, `letterSpacing: '0.08em'`.
   - **LED panel `<Section>`:** `backgroundColor: COLORS.lcd`, `border: 'none'`, `borderRadius: '4px'`. Both of its `Text`s keep `COLORS.armed`; the first stays `rgba(78, 226, 123, 0.55)`.
   - **`Heading`:** `color: COLORS.ink`, `fontWeight: 600`, `letterSpacing: '-0.02em'`.
   - **Body `Text`:** `color: COLORS.muted`.
   - **Button `Link`:**
     - `backgroundColor: COLORS.signalInk`, `color: '#FFFFFF'`;
     - `fontFamily: SANS`, `letterSpacing: '0.02em'`, `textTransform: 'none'`, `borderRadius: '6px'`, `fontWeight: 600`.
     - Keep the button comment, and add: "Signal-ink, not black: partial-invert dark modes darken the card and would swallow a black button (D6)."
   - **"Button not working" `Text` and URL `Text`:** `color: COLORS.muted`.
   - **`Hr`:** `borderTop: \`1px solid ${COLORS.rule}\``.
   - **Expiry `Text`:** `color: COLORS.signalInk`, `letterSpacing: '0.08em'`.
   - **Footer `Text`:** `color: COLORS.muted`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/lib/consent-email.test.ts`
Expected: PASS.

- [ ] **Step 5: Look at it**

Render it to a file and screenshot it:

```bash
pnpm exec tsx -e "import('./src/lib/consent-email.ts').then(async m => { const r = await m.renderConsentEmail('https://example.test/api/confirm?t=abc'); require('node:fs').writeFileSync('/private/tmp/claude-501/-Users-viacheslavdemchenko-Desktop-taras/1d1c8e02-3488-48cc-ac0b-030ca157f044/scratchpad/email.html', r.html) })"
```

If `tsx` is unavailable, write the HTML from a one-off Vitest test instead. Open the file in Chrome, then screenshot it at 390 and 640 wide.

- [ ] **Step 6: Commit**

```bash
git add src/emails/confirm-address.tsx src/lib/consent-email.test.ts vitest.config.ts
git commit -m "Light studio confirmation email with a signal-ink button"
```

---

### Task 10: Title template and `metadataBase`

**Files:**
- Create: `src/content/site.ts`, `src/lib/site-url.ts`, `src/lib/site-url.test.ts`
- Modify: `src/app/layout.tsx` (`metadata`), `docs/env-vars.md`, `env.local.example`

**Interfaces:**
- Produces:
  - `SITE_TITLE = 'Five stages to armed'` from `@/content/site`;
  - `metadataBaseFrom(raw: string | undefined): URL | undefined` from `@/lib/site-url`.

- [ ] **Step 1: Write the failing test**

`src/lib/site-url.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { metadataBaseFrom } from '@/lib/site-url'

describe('metadataBaseFrom (Review Focus 3)', () => {
  it('unset or blank is undefined, so Next falls back to the Vercel production URL (C10)', () => {
    expect(metadataBaseFrom(undefined)).toBeUndefined()
    expect(metadataBaseFrom('')).toBeUndefined()
    expect(metadataBaseFrom('   ')).toBeUndefined()
  })

  it('an absolute http(s) URL is used as is', () => {
    expect(metadataBaseFrom('https://example.com')?.href).toBe('https://example.com/')
    expect(metadataBaseFrom(' http://localhost:3000 ')?.origin).toBe('http://localhost:3000')
  })

  it('a malformed value fails loudly, naming the variable', () => {
    expect(() => metadataBaseFrom('example.com')).toThrow(/CAPTURE_SITE_URL/)
    expect(() => metadataBaseFrom('ftp://example.com')).toThrow(/CAPTURE_SITE_URL/)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/lib/site-url.test.ts`
Expected: FAIL, unresolved import.

- [ ] **Step 3: Implement**

`src/content/site.ts`:

```ts
// TODO(copy): replace once product name and price are confirmed.
export const SITE_TITLE = 'Five stages to armed'
```

`src/lib/site-url.ts`:

```ts
/**
 * `metadataBase` from CAPTURE_SITE_URL, the same variable the confirm link uses
 * (A25).
 *
 * Unset or blank returns undefined ON PURPOSE: Next then falls back to
 * VERCEL_PROJECT_PRODUCTION_URL in production. A hardcoded localhost fallback
 * would override that and ship localhost OG URLs with no warning (C10).
 *
 * A malformed value throws: a build that fails naming the variable beats a
 * site whose link previews silently point nowhere.
 */
export function metadataBaseFrom(raw: string | undefined): URL | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`CAPTURE_SITE_URL must be an absolute http(s) URL, got "${raw}"`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`CAPTURE_SITE_URL must be an absolute http(s) URL, got "${raw}"`)
  }
  return url
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/lib/site-url.test.ts`
Expected: PASS.

- [ ] **Step 5: Use both in `layout.tsx`**

Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (`title`, `metadataBase`) first. Then:

```tsx
import { SITE_TITLE } from '@/content/site'
import { metadataBaseFrom } from '@/lib/site-url'

export const metadata: Metadata = {
  metadataBase: metadataBaseFrom(process.env.CAPTURE_SITE_URL),
  // The template applies to child routes: /subscribed renders
  // "Address confirmed · Five stages to armed" (C9). Formatting, not copy.
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description:
    'A machined field device, assembled as you scroll. Five stages, then it is yours.',
}
```

Remove the old `// TODO(copy)` line above `title`; it now lives in `site.ts`.

- [ ] **Step 6: Document the variable**

In `docs/env-vars.md` and `env.local.example`, add under the Resend block:

```bash
# Public origin of the site, e.g. https://example.com. Used for the confirm link
# in the email AND as metadataBase for link-preview image URLs. Leave unset on
# Vercel to fall back to the production URL; must be absolute http(s) if set.
CAPTURE_SITE_URL=
```

- [ ] **Step 7: Verify and commit**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`
Expected: PASS.

Then run `pnpm start` and open `/subscribed`. The tab title reads "Address confirmed · Five stages to armed".

```bash
git add src/content/site.ts src/lib/site-url.ts src/lib/site-url.test.ts src/app/layout.tsx docs/env-vars.md env.local.example
git commit -m "Title template, and a metadataBase that never overrides the Vercel fallback"
```

---

### Task 11: The OG / Twitter card

**Files:**
- Create:
  - `src/app/og-fonts/Geist-SemiBold-latin.ttf`, `src/app/og-fonts/GeistMono-Regular-latin.ttf`, `src/app/og-fonts/OFL.txt`;
  - `src/app/og-capture/page.tsx`, `src/app/og-capture/CaptureScene.tsx`;
  - `public/og/device.png`;
  - `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`.
- Modify: `README.md` (credits section)

**Interfaces:**
- Consumes:
  - `StudioLighting` (Task 6);
  - `createGltfRig` and `DEVICE_MODEL_URL`;
  - `stageLabel` (Task 2), `PALETTE` (Task 1), `SITE_TITLE` (Task 10);
  - `CREDITS` with `modified` (Task 4).

- [ ] **Step 1: Fetch and subset the fonts**

Pin the source to the v1.7.2 tag (D4), and subset to Basic Latin plus `·` and `—` to stay well under the 500 KB `next/og` budget (C20):

```bash
S=/private/tmp/claude-501/-Users-viacheslavdemchenko-Desktop-taras/1d1c8e02-3488-48cc-ac0b-030ca157f044/scratchpad/fonts
mkdir -p "$S" src/app/og-fonts
curl -fsSL -o "$S/Geist-SemiBold.ttf" https://raw.githubusercontent.com/vercel/geist-font/v1.7.2/fonts/Geist/ttf/Geist-SemiBold.ttf
curl -fsSL -o "$S/GeistMono-Regular.ttf" https://raw.githubusercontent.com/vercel/geist-font/v1.7.2/fonts/GeistMono/ttf/GeistMono-Regular.ttf
curl -fsSL -o src/app/og-fonts/OFL.txt https://raw.githubusercontent.com/vercel/geist-font/v1.7.2/OFL.txt
uvx --from fonttools pyftsubset "$S/Geist-SemiBold.ttf" --unicodes="U+0020-007E,U+00B7,U+2014" --output-file=src/app/og-fonts/Geist-SemiBold-latin.ttf
uvx --from fonttools pyftsubset "$S/GeistMono-Regular.ttf" --unicodes="U+0020-007E,U+00B7,U+2014" --output-file=src/app/og-fonts/GeistMono-Regular-latin.ttf
ls -l src/app/og-fonts
```

Expected: both subset TTFs are well under 60 KB each. Check the first four bytes with `xxd -l 4`: they must be `0001 0000` (TrueType), not `wOF2` (C6).

- [ ] **Step 2: Build a dev-only capture page**

`src/app/og-capture/CaptureScene.tsx`:

```tsx
'use client'

import { useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'

import { DEVICE_MODEL_URL } from '@/lib/device-model'
import { createGltfRig } from '@/three/assembly/gltf-rig'
import { StudioLighting } from '@/three/StudioLighting'

/**
 * Renders the assembled device, square to the camera and centred, on the page
 * ground, so it can be screenshotted into public/og/device.png. Dev only; see
 * page.tsx.
 */
function Device({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const rig = useMemo(() => {
    const r = createGltfRig(scene)
    r.seek(1)
    return r
  }, [scene])
  return <primitive object={rig.root} />
}

export function CaptureScene() {
  const url = DEVICE_MODEL_URL ?? '/models/c4-device.glb'
  return (
    <div id="og-capture" style={{ width: 560, height: 630, background: '#F5F5F2' }}>
      <Canvas camera={{ position: [0, 0, 600], fov: 35, near: 10, far: 10000 }} dpr={2}>
        <Suspense fallback={null}>
          <StudioLighting />
          <Device url={url} />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

`src/app/og-capture/page.tsx`:

```tsx
import { notFound } from 'next/navigation'

import { CaptureScene } from './CaptureScene'

export const metadata = { robots: { index: false, follow: false } }

/** Dev-only render target for the OG device PNG. 404 in production. */
export default function OgCapture() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <main style={{ padding: 0 }}>
      <CaptureScene />
    </main>
  )
}
```

- [ ] **Step 3: Capture the PNG**

1. With `pnpm dev`, open `/og-capture` in Chrome DevTools.
2. Wait for the model to load.
3. Screenshot the `#og-capture` element into the scratchpad (for example `device-raw.png`). The screenshot is 1120×1260 at DPR 2.
4. Shrink it:

```bash
S=/private/tmp/claude-501/-Users-viacheslavdemchenko-Desktop-taras/1d1c8e02-3488-48cc-ac0b-030ca157f044/scratchpad
mkdir -p public/og
python3 - "$S/device-raw.png" public/og/device.png <<'EOF'
import sys
from PIL import Image
img = Image.open(sys.argv[1]).convert('RGB').resize((560, 630), Image.LANCZOS)
img.quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(sys.argv[2], optimize=True)
EOF
ls -l public/og/device.png
```

Expected: ≤ 120 KB. If it's larger, re-run with `colors=128`.

- [ ] **Step 4: Write the image routes**

Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` and `.../04-functions/image-response.md` first.

`src/app/opengraph-image.tsx`:

```tsx
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

import { CREDITS } from '@/content/credits'
import { PALETTE } from '@/content/palette'
import { SECTIONS } from '@/content/sections'
import { SITE_TITLE } from '@/content/site'
import { stageLabel } from '@/content/stage-label'

export const alt = SITE_TITLE
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Read once at module scope. TTF, not WOFF2: Satori cannot read WOFF2 (C6).
const [geist, geistMono, device] = await Promise.all([
  readFile(join(process.cwd(), 'src/app/og-fonts/Geist-SemiBold-latin.ttf')),
  readFile(join(process.cwd(), 'src/app/og-fonts/GeistMono-Regular-latin.ttf')),
  readFile(join(process.cwd(), 'public/og/device.png'), 'base64'),
])

export default async function Image() {
  const first = SECTIONS[0]
  const label = stageLabel(0, SECTIONS.length, first.id)
  // CC BY: the card shows a render of the model, so it carries the credit and
  // the modification notice (D5).
  const model = CREDITS[0]
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: PALETTE.ground, fontFamily: 'Geist' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 620, paddingLeft: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Geist Mono', fontSize: 22, letterSpacing: '0.08em', color: PALETTE.muted }}>
            <div style={{ width: 32, height: 2, background: PALETTE.signal, marginRight: 16 }} />
            <span style={{ color: PALETTE.signalInk }}>{label.count}</span>
            <span>{` · ${label.name}`}</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 76, lineHeight: 1.02, letterSpacing: '-0.035em', color: PALETTE.ink }}>
            {first.heading}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img src={`data:image/png;base64,${device}`} width={560} height={630} style={{ marginLeft: 'auto' }} alt="" />
        <div style={{ position: 'absolute', left: 72, bottom: 24, display: 'flex', fontFamily: 'Geist Mono', fontSize: 14, color: PALETTE.muted }}>
          {`${model.title} by ${model.author}, ${model.licence}${model.modified ? `, ${model.modified}` : ''}`}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist', data: geist, weight: 600, style: 'normal' },
        { name: 'Geist Mono', data: geistMono, weight: 400, style: 'normal' },
      ],
    },
  )
}
```

`src/app/twitter-image.tsx`:

```tsx
// Named re-export: `export *` drops `default` and the route disappears (C8).
export { default, alt, size, contentType } from './opengraph-image'
```

- [ ] **Step 5: Verify the card**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`
Expected: PASS. The build output lists `/opengraph-image` and `/twitter-image`, and `/og-capture` returns 404 under `pnpm start`.

Under `pnpm start`:
- open `/opengraph-image` and `/twitter-image`, and screenshot both;
- run `curl -s localhost:3000 | grep -oE '<meta (property|name)="(og|twitter):image[^>]*>'`, which must print `og:image` and `twitter:image` tags;
- run `du -ch src/app/og-fonts/*.ttf public/og/device.png | tail -1`, which must be ≤ 300K.

- [ ] **Step 6: README credit**

In `README.md`'s credits section, add `, regrouped for animation` to the model credit so that it matches `credits.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/app/og-fonts src/app/og-capture src/app/opengraph-image.tsx src/app/twitter-image.tsx public/og/device.png README.md
git commit -m "Light studio OG and Twitter card, with subset Geist TTFs and the CC BY credit"
```

---

### Task 12: The verification pass and the evidence record

**Files:**
- Modify: `docs/verification.md` (append a section)

**Interfaces:** none.

- [ ] **Step 1: The static checks**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test && NEXT_PUBLIC_USE_DEV_MODEL=true pnpm build`
Expected: all exit 0. `palette-guard.test.ts` covers the spec §5 greps. Record the test count.

- [ ] **Step 2: The screenshot matrix, against the production build**

Run: `pnpm start` (the build above has the model switched on).

In Chrome DevTools, take screenshots at 390×844, 360×780, 768×1024 and 1440×900, at progress 0, 0.3, 0.5, 0.7, 0.9 and 1.0. Set progress by writing the drei scroller's `scrollTop = p * (scrollHeight - clientHeight)` and waiting ~1 s for the damping. Also take reduced-motion shots at 390 and 1440: emulate `prefers-reduced-motion: reduce`.

Review every frame for:
- colour: no olive, brass or amber anywhere;
- the copy band clear of the device on phones;
- sections 4 and 5 never overlapping;
- the credits clear of the copy;
- no horizontal scroll (`scrollWidth === innerWidth`).

- [ ] **Step 3: Contrast on the rendered page**

On the rendered page, read `getComputedStyle(...).color` and `background-color` for a heading, a body `<p>`, the stage label's count span, a credits link, and the LCD error text. To get the error text, submit an invalid address like `abc`. Check each against the token table with `contrast()`. The LCD error text must compute to `rgb(255, 79, 0)`, not green (A17).

- [ ] **Step 4: Mobile Lighthouse**

Run a mobile Lighthouse audit (chrome-devtools `lighthouse_audit`, mobile, performance) on `http://localhost:3000`.

Expected: performance ≥ 70. If it's below 70, apply the spec §3 fallback:
- on `!desktop`, replace `BackWallShadow` with a static pre-blurred shadow image under the device;
- re-run;
- record both scores.

- [ ] **Step 5: Record the evidence**

Append a section `## Light studio redesign (Phase A), 2026-09-27` to `docs/verification.md`, with:
- the test count;
- the Lighthouse score;
- the contrast readings;
- the Task 2 gap measurements;
- the Task 5 freeze numbers;
- the Task 7 hit-test result;
- the OG size total;
- a list of the screenshots taken.

Every claim should be backed by recorded output, as the file's header requires.

- [ ] **Step 6: Commit**

```bash
git add docs/verification.md
git commit -m "Record Phase A verification"
```

Then show the user the key frames (390 and 1440 at p = 0, 0.5 and 1.0, the OG card, the email, and `/subscribed`) and ask for Phase A sign-off, which gates the Phase B plan.

**Deferred to sub-project 3** (spec §5.9): the user's own phone and the Instagram in-app browser against the deployed URL, including typing into the LCD with the keyboard open.
