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
    // Ruling 2: per-component toBeCloseTo, not toEqual on the array —
    // lerpVectors(a, b, 0) can produce -0 where the anchor component is
    // negative, and toEqual's Object.is treats -0 and 0 as different.
    expect(p.position.x).toBeCloseTo(0, 9)
    expect(p.position.y).toBeCloseTo(0, 9)
    expect(p.position.z).toBeCloseTo(BASE_DISTANCE, 9)
    expect(p.target.x).toBeCloseTo(-B.x * 0.55, 9)
    expect(p.target.y).toBeCloseTo(0, 9)
    expect(p.target.z).toBeCloseTo(0, 9)
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
