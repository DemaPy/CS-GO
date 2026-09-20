import { Euler, Object3D, Quaternion, Vector3 } from 'three'

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
  /** metres, added to the seated position */
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
  casing: { pos: [0, -0.42, -0.1], rot: [0, 0, 0.5] },
  charges: { pos: [0.4, 0.18, -0.12], rot: [0.5, 0.6, 0.3] },
  harness: { pos: [0.62, 0, 0], rot: [0, 0, 1.2] },
  panel: { pos: [0, 0.42, 0], rot: [0.9, 0, 0] },
  arm: { pos: [0, -0.4, 0], rot: [0, 0, 1.5] },
}

interface Part {
  object: Object3D
  section: SectionId
  startPos: Vector3
  endPos: Vector3
  startQuat: Quaternion
  endQuat: Quaternion
}

const SECTION_RANGE = new Map(SECTIONS.map((s) => [s.id, s.range] as const))

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

    const scatter = SCATTER[section.id]

    // `object.position` is in parent-local units, but SCATTER is authored in
    // metres. The exported model carries its unit conversion as a scale on an
    // ancestor node, so a raw metre offset here would be divided by that scale
    // and the parts would barely move. Convert the displacement instead.
    if (object.parent) object.parent.getWorldScale(parentScale)
    else parentScale.set(1, 1, 1)
    offset.set(
      scatter.pos[0] / (parentScale.x || 1),
      scatter.pos[1] / (parentScale.y || 1),
      scatter.pos[2] / (parentScale.z || 1),
    )

    const endPos = object.position.clone()
    const endQuat = object.quaternion.clone()

    parts.push({
      object,
      section: section.id,
      endPos,
      endQuat,
      startPos: endPos.clone().add(offset),
      startQuat: endQuat
        .clone()
        .multiply(
          new Quaternion().setFromEuler(new Euler(...(scatter.rot ?? [0, 0, 0]))),
        ),
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
  displayAnchor.updateWorldMatrix(true, false)
  const anchorScale = new Vector3()
  displayAnchor.getWorldScale(anchorScale)

  /**
   * Stand the anchor off the panel face before normalising its scale.
   *
   * `DisplayPanel` occludes by raycasting from the camera to this anchor
   * against `displayAnchor.parent`. For the placeholder that parent is a single
   * flat box and the anchor sits squarely in front of it, so no ray can ever
   * clip it. Here the parent is a group of 13 meshes — a plate and a 4x3 grid
   * of keypad tiles — and the exported anchor cleared them by only 0.5 mm.
   * Across tiles roughly 10 mm wide that is about 3 degrees of angular margin,
   * so once the camera swings off-axis during the scroll the ray grazes a
   * neighbouring tile, drei hides the readout, and the next frame shows it
   * again. That flicker is the symptom; this clearance is the cause.
   *
   * 4 mm buys ~22 degrees, which covers the whole Section 5 camera path, and
   * is still flush enough to read as sitting on the device.
   */
  const CLEARANCE_M = 0.004
  displayAnchor.position.z += CLEARANCE_M / (anchorScale.z || 1)

  displayAnchor.scale.set(
    displayAnchor.scale.x / (anchorScale.x || 1),
    displayAnchor.scale.y / (anchorScale.y || 1),
    displayAnchor.scale.z / (anchorScale.z || 1),
  )
  displayAnchor.updateMatrix()

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
      const t = smoothstep(subProgress(progress, range))
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
