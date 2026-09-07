import type { Object3D } from 'three'

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
 * Reference bounding box in metres, measured from `C4-1.fbx` in Blender and
 * corrected by 0.0231 (it imports ~43x oversized). Recorded in
 * `docs/asset-provenance.md`.
 *
 * The aspect ratio is a framing approximation, not a real-world measurement —
 * it matches neither an M112 charge nor obviously a satchel. Only the
 * longest-dimension check from plan Step 3.2 (0.2-0.3 m) is satisfied. If the
 * shipped device is a different shape, the Section 5 camera path is what breaks.
 */
export const REFERENCE_BOUNDS = {
  x: 0.1655,
  y: 0.25,
  z: 0.0814,
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
