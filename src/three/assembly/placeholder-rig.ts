import {
  BoxGeometry,
  Euler,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three'

import { SECTIONS, subProgress, type SectionId } from '@/content/sections'
import { REFERENCE_BOUNDS as B, smoothstep, type AssemblyRig } from './types'

/**
 * One movable piece. `start` and `end` are absolute transforms, never deltas —
 * that is what makes `seek` a pure function of progress (plan Step 4.5).
 */
interface PartSpec {
  name: string
  section: SectionId
  size: [number, number, number]
  /** seated transform — where the part ends up */
  end: { pos: [number, number, number]; rot?: [number, number, number] }
  /** scattered transform — where the part flies in from */
  start: { pos: [number, number, number]; rot?: [number, number, number] }
}

/**
 * Sized from REFERENCE_BOUNDS so the placeholder frames like the real device
 * and the Section 5 camera path survives the Phase 3 swap.
 *
 * Reads as: a back shell, four charges seated 2x2 on its face, a harness bar
 * crossing them, a display panel in the upper front, and an arming switch below.
 */
const PARTS: PartSpec[] = [
  {
    name: 'casing',
    section: 'casing',
    size: [B.x, B.y, B.z * 0.45],
    end: { pos: [0, 0, -B.z * 0.275] },
    start: { pos: [0, -B.y * 2.2, -B.z * 0.275], rot: [0, 0, 0.5] },
  },

  // Four charges, 2x2 on the casing face. Each flies in from its own corner so
  // they read as four separate objects rather than one block splitting.
  ...([
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ] as const).map(([sx, sy], i): PartSpec => ({
    name: `charge_${i + 1}`,
    section: 'charges',
    size: [B.x * 0.46, B.y * 0.46, B.z * 0.5],
    end: { pos: [sx * B.x * 0.245, sy * B.y * 0.245, B.z * 0.1] },
    start: {
      pos: [sx * B.x * 2.4, sy * B.y * 1.9, B.z * 3.5],
      rot: [sy * 0.7, sx * 0.7, sx * sy * 0.4],
    },
  })),

  {
    name: 'harness',
    section: 'harness',
    size: [B.x * 1.02, B.y * 0.055, B.z * 0.055],
    end: { pos: [0, 0, B.z * 0.36] },
    start: { pos: [-B.x * 3.2, 0, B.z * 0.36], rot: [0, 0, 1.2] },
  },
  {
    name: 'panel',
    section: 'panel',
    size: [B.x * 0.62, B.y * 0.3, B.z * 0.1],
    end: { pos: [0, B.y * 0.28, B.z * 0.42] },
    start: { pos: [0, B.y * 0.28, B.z * 4.0], rot: [0.9, 0, 0] },
  },
  {
    name: 'arm_switch',
    section: 'arm',
    size: [B.x * 0.16, B.y * 0.075, B.z * 0.1],
    end: { pos: [0, -B.y * 0.34, B.z * 0.42] },
    start: { pos: [0, -B.y * 0.34, B.z * 2.2], rot: [0, 0, 1.5] },
  },
]

interface Part {
  object: Mesh
  section: SectionId
  startPos: Vector3
  endPos: Vector3
  startQuat: Quaternion
  endQuat: Quaternion
}

const SECTION_RANGE = new Map(SECTIONS.map((s) => [s.id, s.range] as const))

function quatFrom(rot?: [number, number, number]): Quaternion {
  return new Quaternion().setFromEuler(new Euler(...(rot ?? [0, 0, 0])))
}

export function createPlaceholderRig(): AssemblyRig {
  const root = new Group()
  root.name = 'placeholder-rig'

  const geometries: BoxGeometry[] = []
  const materials: MeshStandardMaterial[] = []
  const parts: Part[] = []

  for (const spec of PARTS) {
    const geometry = new BoxGeometry(...spec.size)
    const material = new MeshStandardMaterial({
      color: spec.section === 'panel' ? 0x1b2b22 : 0x4a4a44,
      roughness: 0.7,
      metalness: 0.2,
    })
    geometries.push(geometry)
    materials.push(material)

    const mesh = new Mesh(geometry, material)
    mesh.name = spec.name
    root.add(mesh)

    parts.push({
      object: mesh,
      section: spec.section,
      startPos: new Vector3(...spec.start.pos),
      endPos: new Vector3(...spec.end.pos),
      startQuat: quatFrom(spec.start.rot),
      endQuat: quatFrom(spec.end.rot),
    })
  }

  // Parented to the panel and sitting just off its front face, so nothing
  // downstream hardcodes display coordinates (plan Step 4.4). Everything that
  // needs to know where the display is reads this.
  const panel = parts.find((p) => p.section === 'panel')
  if (!panel) throw new Error('placeholder rig has no panel part')

  const displayAnchor = new Object3D()
  displayAnchor.name = 'display-anchor'
  displayAnchor.position.set(0, 0, (B.z * 0.1) / 2 + 0.0005)
  panel.object.add(displayAnchor)

  function seek(progress: number): void {
    for (const part of parts) {
      const range = SECTION_RANGE.get(part.section)
      if (!range) continue
      const t = smoothstep(subProgress(progress, range))
      // lerpVectors / slerpQuaternions write absolute values from the stored
      // endpoints — no read-modify-write, so no drift across calls.
      part.object.position.lerpVectors(part.startPos, part.endPos, t)
      part.object.quaternion.slerpQuaternions(part.startQuat, part.endQuat, t)
    }
  }

  seek(0)

  return {
    root,
    seek,
    displayAnchor,
    dispose() {
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
      root.clear()
    },
  }
}
