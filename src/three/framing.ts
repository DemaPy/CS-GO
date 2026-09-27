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
export const PANEL_HEIGHT_FRACTION = 0.36

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

/**
 * Distance at which a w x h rectangle fills at most the given share of each
 * axis. Constrained on BOTH axes and the further distance taken, so the
 * subject never exceeds its share of either — width alone is not enough: on
 * a short, wide viewport (1680x720) a width-fitted panel grew vertically
 * until only 16px separated it from the headline.
 */
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

  // At full push the panel is framed dead centre, straight down the axis —
  // finalPos sits directly in front of the anchor and target becomes the
  // anchor itself. Two earlier attempts pushed the panel sideways to dodge
  // the copy column instead, first with a hardcoded world offset, then a
  // measured one. Both clipped the headline, and the second was worse: aiming
  // off-axis views the panel at an angle, and perspective then stretches its
  // projected width ~40%, so the fit arithmetic was solving for the wrong
  // number. Section 5's copy now sits *above* the panel (see Overlay), which
  // removes the conflict instead of negotiating with it.
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
