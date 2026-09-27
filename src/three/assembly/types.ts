import type { Object3D } from 'three'

import type { SectionId } from '@/content/sections'

/**
 * The seam that makes the 3D model a swappable dependency.
 *
 * Phase 1 ships `createPlaceholderRig` (procedural boxes). Phase 2 swaps in a
 * baked-clip rig against a vetted model. Nothing downstream of this interface
 * changes when that happens — only which implementation is constructed.
 */
export interface AssemblyRig {
  /** the object to mount in the scene */
  readonly root: Object3D
  /**
   * Absolute seek. Must be **idempotent** (calling twice with the same value
   * produces identical world matrices) and **direction-agnostic**
   * (`seek(1)` then `seek(0)` returns every part to its exact start transform).
   *
   * This is the requirement the whole page rests on: scroll drives a scrub, not
   * fire-once triggers, so `seek` has to be a pure function of `progress` and
   * may never accumulate or hold state between calls.
   */
  seek(progress: number): void
  /** world-space anchor for the display panel */
  readonly displayAnchor: Object3D
  dispose(): void
}

/**
 * Reference bounding box in MILLIMETRES, measured from `C4-1.fbx` in Blender
 * and corrected by 0.0231 (it imports ~43x oversized), then taken to mm.
 * Recorded in `docs/asset-provenance.md`.
 *
 * ## Why millimetres and not metres
 *
 * The obvious choice is metres, and it is wrong here. drei's `Html` in
 * `transform` mode writes the object's world translation straight into a CSS
 * matrix as pixels — `getObjectCSSMatrix` scales the basis by 1/40 but leaves
 * translation at x1. In metres the camera ends up ~0.107 units from the panel,
 * so in CSS it sits 0.107px from a perspective origin of ~1773px: 0.006% of
 * the way, magnified ~16,600x. At that margin a sub-pixel float change — one
 * pixel of viewport width, one scroll frame — pushes the readout to or past the
 * eye plane and the browser stops painting it. That was one bug wearing three
 * masks: the readout blinking while scrolling, vanishing at full scroll, and
 * flipping between viewport widths of 1993 and 1994.
 *
 * At 1000x the camera sits ~107 units back, so the CSS margin is ~107px and
 * magnification drops to ~17x, which is an ordinary, stable projection.
 *
 * Everything in world space scales together — see `BASE_POS`, `PANEL_WIDTH`,
 * the camera's near/far, both rigs' scatter offsets, and the `scale` on
 * `<Html>`. Ratios are unchanged, so the framing maths is untouched.
 *
 * The aspect ratio is a framing approximation, not a real-world measurement —
 * it matches neither an M112 charge nor obviously a satchel. Only the
 * longest-dimension check from plan Step 3.2 (0.2-0.3 m) is satisfied. If the
 * shipped device is a different shape, the Section 5 camera path is what breaks.
 */
export const REFERENCE_BOUNDS = {
  x: 165.5,
  y: 250,
  z: 81.4,
} as const

/**
 * Smoothstep easing. Plan Step 4.3 — a linear lerp reads as mechanical sliding;
 * parts should settle. Pure, and exactly 0 at t=0 and 1 at t=1, which is what
 * keeps the Step 4.5 round-trip check exact rather than approximately exact.
 */
export function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
}

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

/** The groups that read as metal rather than painted body. */
export const METAL_SECTIONS: ReadonlySet<SectionId> = new Set<SectionId>([
  'harness',
  'arm',
])
