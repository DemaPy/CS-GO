import { Box3, Euler, Group, Object3D, Quaternion, Vector3 } from 'three'

import { SECTIONS, subProgress, type SectionId } from '@/content/sections'
import { smoothstep, type AssemblyRig } from './types'

/**
 * The Phase 2 rig: the same `AssemblyRig` contract as the placeholder, driven
 * by a real glTF instead of procedural boxes.
 *
 * Not the plan's Step 9.2 `mixer.setTime` implementation, and deliberately so.
 * That step assumes the model ships with a baked animation clip; the model this
 * was built against has none (`AnimationStack: 0` — see
 * `docs/asset-provenance.md`). So the scrub stays here in code, and the model
 * supplies only geometry grouped into the five `SectionId` sets. If a future
 * asset does arrive with a clip, that is a different implementation behind this
 * same interface — which is the point of the interface.
 *
 * Expects a scene containing one node per `SectionId`, each pivoted at its own
 * bounding-box centre, plus a `DisplayAnchor` node parented to `panel`.
 */

interface Scatter {
  /** world units (millimetres), added to the seated position */
  pos: [number, number, number]
  rot?: [number, number, number]
}

/**
 * Where each group flies in from.
 *
 * Same constraint as the placeholder rig: parts scatter sideways, up, down and
 * *behind*, never toward the camera — a part pushed to +z crosses the near
 * plane and fills the viewport as an unreadable black mass. The harness and
 * charges come in from the right because the left third of a desktop viewport
 * is the copy column, and a part crossing the headline reads as a bug.
 */
const SCATTER: Record<SectionId, Scatter> = {
  casing: { pos: [0, -420, -100], rot: [0, 0, 0.5] },
  // Only a fallback. A model whose charges group holds more than one mesh gets
  // CHARGE_SCATTER below instead, one entry per brick.
  charges: { pos: [400, 180, -120], rot: [0.5, 0.6, 0.3] },
  harness: { pos: [620, 0, 0], rot: [0, 0, 1.2] },
  panel: { pos: [0, 420, 0], rot: [0.9, 0, 0] },
  arm: { pos: [0, -400, 0], rot: [0, 0, 1.5] },
}

/**
 * The charge bricks converge from three different directions, ordered
 * left-to-right by their seated position.
 *
 * One block arriving from one direction reads as a single object splitting
 * apart; three arriving from three reads as three objects being assembled,
 * which is what "each block locks to a face" claims. Same reasoning as the
 * placeholder rig's four corner-entry charges.
 *
 * None of them enters from the left. On desktop the copy column owns the left
 * third of the frame, and a brick crossing the headline reads as a bug — so the
 * available sides are below, above and right, each pushed back in -z so the
 * bricks arrive from behind the casing rather than through the lens.
 *
 * `window` staggers each brick inside the charges section, as a fraction of
 * that section's own progress. They land in sequence rather than together, so
 * the eye can follow each one seating.
 */
interface ChargeSpec extends Scatter {
  /** sub-range of the charges section, 0..1 */
  window: [number, number]
}

const CHARGE_SCATTER: ChargeSpec[] = [
  { pos: [-60, -440, -100], rot: [0.5, 0, 0.35], window: [0.0, 0.72] },
  { pos: [40, 460, -140], rot: [-0.55, 0.2, -0.3], window: [0.14, 0.86] },
  { pos: [560, 50, -80], rot: [0.2, -0.6, 0.45], window: [0.28, 1.0] },
]

interface Part {
  object: Object3D
  section: SectionId
  startPos: Vector3
  endPos: Vector3
  startQuat: Quaternion
  endQuat: Quaternion
  /** sub-range of the section's own progress this part animates over */
  window: [number, number]
}

const SECTION_RANGE = new Map(SECTIONS.map((s) => [s.id, s.range] as const))

/** Re-maps a section's 0..1 progress onto a part's sub-window, clamped. */
function windowed(t: number, [from, to]: [number, number]): number {
  if (to <= from) return t
  const w = (t - from) / (to - from)
  return w < 0 ? 0 : w > 1 ? 1 : w
}

/**
 * Gives each mesh in a group its own pivot, so it can move independently.
 *
 * The exported bricks share the charges group's pivot, and their geometry is
 * baked at absolute positions. Rotating one about that shared origin swings it
 * through the casing instead of turning on the spot — the failure plan Step
 * 10a.3 describes. Wrapping each mesh in a Group placed at the mesh's own
 * bounding-box centre fixes that without touching geometry, which matters
 * because the geometry is shared with drei's cache and must not be mutated.
 *
 * Returns the new pivots ordered left to right, or an empty array when there is
 * nothing to split.
 */
function splitIntoPivots(group: Object3D): Object3D[] {
  const meshes = group.children.filter((c) => (c as { isMesh?: boolean }).isMesh)
  if (meshes.length < 2) return []

  const box = new Box3()
  const centre = new Vector3()

  const pivots = meshes.map((mesh, i) => {
    box.setFromObject(mesh)
    box.getCenter(centre)
    group.worldToLocal(centre)

    const pivot = new Group()
    pivot.name = `${group.name}_${i + 1}`
    pivot.position.copy(centre)

    // Re-expressed in the pivot's frame. The pivot carries no rotation or
    // scale, so this is a plain subtraction.
    mesh.position.sub(centre)
    pivot.add(mesh)
    group.add(pivot)

    return pivot
  })

  pivots.sort((a, b) => a.position.x - b.position.x)
  return pivots
}

export function createGltfRig(source: Object3D): AssemblyRig {
  // Cloned, not used directly: `useGLTF` caches the loaded scene, so mutating
  // it in place would leak this rig's transforms into the next mount. A clone
  // copies the node graph but shares geometries and materials, which is also
  // why `dispose` below must not free them.
  const root = source.clone()
  root.name = 'gltf-rig'
  root.updateMatrixWorld(true)

  const parts: Part[] = []
  const parentScale = new Vector3()
  const offset = new Vector3()

  for (const section of SECTIONS) {
    const object = root.getObjectByName(section.id)
    if (!object) {
      throw new Error(`glTF rig: model has no "${section.id}" group`)
    }

    // The charges section animates one brick at a time when the model provides
    // more than one; everything else moves as a single group.
    const pivots = section.id === 'charges' ? splitIntoPivots(object) : []
    const movers: Object3D[] = pivots.length > 0 ? pivots : [object]

    movers.forEach((mover, i) => {
      const spec =
        pivots.length > 0
          ? CHARGE_SCATTER[i % CHARGE_SCATTER.length]
          : SCATTER[section.id]

      // The model is exported with its unit conversion baked into geometry, so
      // no ancestor should carry a scale and this division is by 1. It stays as
      // a guard: a model that does carry one would otherwise have every scatter
      // offset silently divided by it, and the parts would barely move.
      if (mover.parent) mover.parent.getWorldScale(parentScale)
      else parentScale.set(1, 1, 1)
      offset.set(
        spec.pos[0] / (parentScale.x || 1),
        spec.pos[1] / (parentScale.y || 1),
        spec.pos[2] / (parentScale.z || 1),
      )

      const endPos = mover.position.clone()
      const endQuat = mover.quaternion.clone()

      parts.push({
        object: mover,
        section: section.id,
        endPos,
        endQuat,
        startPos: endPos.clone().add(offset),
        startQuat: endQuat
          .clone()
          .multiply(
            new Quaternion().setFromEuler(new Euler(...(spec.rot ?? [0, 0, 0]))),
          ),
        window:
          pivots.length > 0
            ? CHARGE_SCATTER[i % CHARGE_SCATTER.length].window
            : [0, 1],
      })
    })
  }

  const displayAnchor = root.getObjectByName('DisplayAnchor')
  if (!displayAnchor) {
    throw new Error('glTF rig: model has no "DisplayAnchor" node')
  }

  /**
   * Force the anchor to unit world scale.
   *
   * `DisplayPanel` is portalled *into* this node, so it inherits whatever scale
   * the node carries — and an exported model keeps its unit conversion as a
   * scale on an ancestor (here 0.0231). Left alone, the display shell renders
   * ~43x too small while the camera still pushes in to frame a shell it
   * believes is `PANEL_WIDTH` metres wide, which puts the input on screen as a
   * few black pixels in the middle of a hugely magnified keypad.
   *
   * The placeholder rig is unit-scale throughout, which is the only reason
   * those measured constants worked. Normalising here keeps the anchor's
   * contract — "world-space anchor for the display panel" — true for any model,
   * whatever units it was authored in. Position is unaffected: a node's own
   * scale does not move it.
   */
  /**
   * The anchor must already be at unit world scale — the model is authored in
   * metres and exported with its unit conversion baked into the geometry, not
   * left on a node.
   *
   * This is checked rather than corrected, because correcting it here is what
   * broke the display. An earlier version cancelled a 0.0231 unit scale by
   * giving the anchor a local scale of 43.29. The world scale came out at 1, so
   * that looked right, but `DisplayPanel` is portalled into this node and drei
   * builds its CSS matrix from it: a 43x local scale inside a 0.0231 parent
   * inflated drei's container to roughly 6,000,000 x 7,300,000 px, offset about
   * 7.3 million px upward. At that magnitude a sub-pixel change in the
   * projection moves the readout thousands of pixels, so it vanished and
   * reappeared on a *one pixel* change of viewport width — visible at 1993,
   * gone at 1994.
   *
   * A residual node scale is therefore an export bug, and the export is where
   * it gets fixed.
   */
  displayAnchor.updateWorldMatrix(true, false)
  const anchorScale = new Vector3()
  displayAnchor.getWorldScale(anchorScale)
  if (Math.abs(anchorScale.x - 1) > 1e-3) {
    console.warn(
      `[gltf-rig] DisplayAnchor world scale is ${anchorScale.x.toFixed(4)}, ` +
        'expected 1. The model still carries a unit conversion on a node; ' +
        'bake it into the geometry on export. The display will be mis-sized ' +
        'until that is fixed.',
    )
  }

  /**
   * Absolute seek, identical in contract to the placeholder's: every call
   * writes position and rotation from the stored endpoints, so it is
   * idempotent and direction-agnostic. Nothing reads the current transform,
   * which is what stops drift accumulating across a scroll up and back down.
   */
  function seek(progress: number): void {
    for (const part of parts) {
      const range = SECTION_RANGE.get(part.section)
      if (!range) continue
      const t = smoothstep(windowed(subProgress(progress, range), part.window))
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
      // Intentionally empty. This rig owns no GPU resources: `clone()` copies
      // the node graph but shares geometries and materials with drei's glTF
      // cache, so freeing them here would blank every other mount of the same
      // model. The cloned nodes are plain objects — R3F detaches them from the
      // scene on unmount and they are then garbage like anything else.
      //
      // It must also stay a no-op rather than `root.clear()`. React StrictMode
      // double-invokes effects against the same component instance, while the
      // `useMemo` that built this rig is NOT recomputed between the two passes
      // — so a destructive dispose empties the very rig the remounted component
      // goes on using, and the scene renders nothing. That is invisible in a
      // production build, where effects run once.
    },
  }
}
