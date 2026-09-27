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
