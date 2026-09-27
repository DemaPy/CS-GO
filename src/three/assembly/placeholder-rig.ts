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
import {
  METAL_SECTIONS,
  PART_COLOR,
  REFERENCE_BOUNDS as B,
  smoothstep,
  type AssemblyRig,
} from './types'

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
 *
 * ## Scatter constraint
 *
 * Start transforms must sit **outside the frame** but never **between the
 * device and the lens**. With the camera at z=550 and fov 35, the visible
 * half-extents at z=0 are ~174 (y) and ~278 (x on a 16:10 viewport), so a
 * part is off-frame past those. Pushing a part toward +z instead puts it
 * through the near plane, where it fills the viewport as an unreadable black
 * mass — parts scatter sideways, up, down, and *behind*, never forward.
 */
const PARTS: PartSpec[] = [
  {
    name: 'casing',
    section: 'casing',
    size: [B.x, B.y, B.z * 0.45],
    end: { pos: [0, 0, -B.z * 0.275] },
    // rises from below the frame
    start: { pos: [0, -420, -B.z * 0.9], rot: [0, 0, 0.5] },
  },

  // The charge blocks, 2x2 on the casing face. Each flies in from its own
  // corner so they read as separate objects rather than one block splitting.
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
    // in from its own off-frame corner, and from behind
    start: {
      pos: [sx * 460, sy * 340, -110],
      rot: [sy * 0.7, sx * 0.7, sx * sy * 0.4],
    },
  })),

  {
    name: 'harness',
    section: 'harness',
    size: [B.x * 1.02, B.y * 0.055, B.z * 0.055],
    end: { pos: [0, 0, B.z * 0.36] },
    // Slides in from off-frame RIGHT. Coming from the left would drag it
    // straight across the copy column, which sits in the left third on
    // desktop — a part crossing the headline reads as a bug, not assembly.
    start: { pos: [620, 0, B.z * 0.36], rot: [0, 0, 1.2] },
  },
  {
    name: 'panel',
    section: 'panel',
    size: [B.x * 0.62, B.y * 0.3, B.z * 0.1],
    end: { pos: [0, B.y * 0.28, B.z * 0.42] },
    // drops in from above the frame, tilted
    start: { pos: [0, 420, B.z * 0.42], rot: [0.9, 0, 0] },
  },
  {
    name: 'arm_switch',
    section: 'arm',
    size: [B.x * 0.16, B.y * 0.075, B.z * 0.1],
    end: { pos: [0, -B.y * 0.34, B.z * 0.42] },
    // up from below the frame
    start: { pos: [0, -400, B.z * 0.42], rot: [0, 0, 1.5] },
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
    // The harness and the arming switch are the metal parts — oxidised brass,
    // so they read as a different material from the olive-drab body rather
    // than a darker box. Same split the glTF rig paints with.
    const metal = METAL_SECTIONS.has(spec.section)
    const material = new MeshStandardMaterial({
      color: PART_COLOR[spec.section],
      roughness: metal ? 0.35 : 0.72,
      metalness: metal ? 0.8 : 0.15,
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
  displayAnchor.position.set(0, 0, (B.z * 0.1) / 2 + 0.5)
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
    /**
     * Frees the GPU resources this rig owns — and deliberately leaves the node
     * graph alone.
     *
     * `root.clear()` used to be the last line here, and it is what made the
     * error-boundary fallback in `Experience` render nothing at all: when the
     * glTF branch throws, React recovers by re-rendering, which runs this
     * cleanup against a `useMemo` result that is NOT rebuilt on the pass that
     * follows. The rig the remounted component goes on using is then an empty
     * `Group` — `__rig.root.children.length === 0`, a canvas with a scene in it
     * and nothing to see. React StrictMode's double-invoked effects do the same
     * thing for the same reason; `gltf-rig`'s dispose carries the same note.
     *
     * Detaching children is unrecoverable. Disposing geometries and materials
     * is not: three re-uploads them on the next frame that needs them, so a
     * spurious call costs one upload rather than the whole device.
     */
    dispose() {
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
    },
  }
}
