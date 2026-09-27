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
