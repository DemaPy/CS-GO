'use client'

import { Scroll, ScrollControls, useScroll } from '@react-three/drei'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Object3D, Vector3, type PerspectiveCamera } from 'three'

import { DisplayPanel } from '@/components/DisplayPanel'
import { Overlay } from '@/components/Overlay'
import { SECTIONS, subProgress } from '@/content/sections'
import { useMediaQuery, useReducedMotion } from '@/lib/use-reduced-motion'
import { createPlaceholderRig } from '@/three/assembly/placeholder-rig'
import { REFERENCE_BOUNDS as B, smoothstep } from '@/three/assembly/types'

/** Scroll range over which the camera pushes toward the display (Step 5.4). */
const CAMERA_PUSH: [number, number] = [0.8, 1.0]

/**
 * Framing distance. Device longest dimension is 0.25 m at 35° fov, which needs
 * 0.40 m to fit exactly — 0.55 leaves margin so the assembled device is not
 * flush against the frame edge.
 */
const BASE_POS = new Vector3(0, 0, 0.55)

/**
 * World width of the display shell. Measured, not derived: at a known camera
 * distance the shell rendered 926px of a 1440px viewport, giving ~0.0876 m.
 */
const PANEL_WIDTH = 0.0876

/**
 * World height of the shell. Measured: 922x298 px at 1280x800, so the shell
 * renders at ~3.09:1, giving 0.0876 / 3.09.
 */
const PANEL_HEIGHT = 0.0283

/** Share of the frame the panel may occupy at full push, per axis. */
const PANEL_WIDTH_FRACTION = 0.72
const PANEL_HEIGHT_FRACTION = 0.42

/**
 * On desktop the camera aims left of the device, which pushes the device into
 * the right two-thirds and leaves the left third for copy. On mobile it aims
 * at the device centre — the device sits *behind* the copy at reduced opacity
 * rather than stacking, because stacking halves both.
 */
function baseTarget(desktop: boolean): Vector3 {
  return new Vector3(desktop ? -B.x * 0.55 : 0, 0, 0)
}

interface DeviceProps {
  desktop: boolean
  /** When false the rig mounts fully assembled and never scrubs (Step 8.1). */
  scrub: boolean
}

function Device({ desktop, scrub }: DeviceProps) {
  const rig = useMemo(() => createPlaceholderRig(), [])
  useEffect(() => () => rig.dispose(), [rig])

  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const scroll = useScroll()

  // Scratch vectors, reused every frame so the scrub allocates nothing.
  const anchor = useRef(new Vector3())
  const finalPos = useRef(new Vector3())
  const pos = useRef(new Vector3())
  const target = useRef(new Vector3())

  const base = useMemo(() => baseTarget(desktop), [desktop])

  // Read every frame by DisplayPanel. A ref rather than state, because this
  // changes at 60fps and only the lit/unlit transition needs React.
  const progressRef = useRef(scrub ? 0 : 1)

  // displayAnchor's parent IS the panel mesh, so the occlusion target comes
  // free without widening the AssemblyRig interface.
  const panelRef = useRef<Object3D | null>(rig.displayAnchor.parent)

  // Section 5's copy block, looked up once. Written to every frame during the
  // camera push so it holds still instead of scrolling through the panel.
  // Resolved lazily, not in an effect: Device mounts inside the Canvas before
  // drei has rendered the <Scroll html> overlay, so an effect-time lookup here
  // returns null and the pin silently never applies.
  const stage5 = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const node = stage5.current
    return () => {
      if (node) node.style.transform = ''
    }
  }, [scrub, desktop])

  /**
   * Holds the Section 5 copy at the top of the viewport once the panel lights.
   *
   * drei scrolls the five 100vh blocks across a travel of (n-1) viewports, so
   * the last block's natural top is `travel * (1 - progress)` — it is still
   * sliding up through the middle of the frame exactly when the display goes
   * live. This counter-translates it to its final position over 0.80-0.85 and
   * then keeps it there. Both terms are zero at progress 0.80, so it joins the
   * natural motion continuously rather than snapping.
   */
  function pinStageFive(progress: number) {
    if (!stage5.current) {
      stage5.current = document.querySelector<HTMLElement>('[data-stage5-copy]')
    }
    const node = stage5.current
    if (!node) return

    if (progress < CAMERA_PUSH[0]) {
      node.style.transform = ''
      return
    }

    const viewport = size.height
    const travel = (SECTIONS.length - 1) * viewport
    const settle = smoothstep((progress - CAMERA_PUSH[0]) / 0.05)
    const natural = travel * (1 - progress)
    const desired = (1 - settle) * travel * (1 - CAMERA_PUSH[0])
    const pin = Math.min(0, desired - natural)

    node.style.transform = `translateY(${pin}px)`
  }

  /** Places the camera for a given progress. Pure — no accumulated state. */
  function frame(progress: number) {
    progressRef.current = progress
    rig.seek(progress)
    rig.root.updateMatrixWorld(true)

    const t = smoothstep(subProgress(progress, CAMERA_PUSH))
    rig.displayAnchor.getWorldPosition(anchor.current)

    // Section 5 frames the panel dead centre, looking straight down the axis.
    //
    // Two earlier attempts pushed the panel sideways to dodge the copy column —
    // first a hardcoded world offset, then a measured one. Both clipped the
    // headline, and the second was worse: aiming off-axis views the panel at an
    // angle, and perspective then stretches its projected width ~40%, so the
    // fit arithmetic was solving for the wrong number. Section 5's copy now
    // sits *above* the panel (see Overlay), which removes the conflict instead
    // of negotiating with it. Distance is still viewport-derived so the panel
    // keeps the same share of the frame at any aspect ratio.
    const aspect = size.width / Math.max(size.height, 1)
    const halfFov = Math.tan(((camera as PerspectiveCamera).fov * Math.PI) / 360)

    // Constrain on BOTH axes and take the further distance, so the panel never
    // exceeds its share of either. Width alone is not enough: on a short, wide
    // viewport (1680x720) a width-fitted panel grew vertically until only 16px
    // separated it from the headline.
    const distForWidth =
      PANEL_WIDTH / PANEL_WIDTH_FRACTION / (2 * halfFov * aspect)
    const distForHeight = PANEL_HEIGHT / PANEL_HEIGHT_FRACTION / (2 * halfFov)
    const dist = Math.max(distForWidth, distForHeight)

    finalPos.current.copy(anchor.current)
    finalPos.current.z += dist

    pos.current.lerpVectors(BASE_POS, finalPos.current, t)
    target.current.lerpVectors(base, anchor.current, t)

    camera.position.copy(pos.current)
    camera.lookAt(target.current)

    pinStageFive(progress)
  }

  // Reduced motion: assemble once, at the end state, and stop.
  useEffect(() => {
    if (!scrub) frame(1)
    // Re-frames on resize, which the scrub branch gets free from useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrub, desktop, size.width, size.height])

  useFrame(() => {
    if (scrub) frame(scroll.offset)
  })

  return (
    <>
      <primitive object={rig.root} />
      {/* Portalled into displayAnchor so the readout rides the panel without
          reparenting the anchor out of the rig — mounting it as a <primitive>
          child would tear it off the panel it is measured against. */}
      {createPortal(
        <DisplayPanel progress={progressRef} occludeAgainst={panelRef} />,
        rig.displayAnchor,
      )}
    </>
  )
}

function Lighting() {
  return (
    <>
      {/* Key light high and camera-right, a dim brass bounce opposite it. The
          olive body only separates from the olive-black ground if the key is
          strong enough — at low intensity the whole device reads as one dark
          mass, which is what the first pass looked like. */}
      <ambientLight intensity={0.7} color="#cfd3c0" />
      <directionalLight position={[0.5, 0.6, 0.7]} intensity={3.4} />
      <directionalLight position={[-0.6, -0.2, 0.35]} intensity={0.9} color="#8a6e3b" />
    </>
  )
}

/** Shared canvas configuration so the two branches cannot drift apart. */
const CANVAS_PROPS = {
  // Step 8.3: cap retina cost. This is the first lever if Lighthouse dips.
  dpr: [1, 2] as [number, number],
  camera: { position: [0, 0, 0.55] as [number, number, number], fov: 35, near: 0.01, far: 10 },
} as const

export function Experience() {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 768px)')

  // Both are null until mounted. Rendering the copy alone on the server keeps
  // the content real without a canvas or a progress value in the HTML — the
  // hydration mismatch Step 8.5 forbids.
  if (reduced === null || desktop === null) {
    return (
      <main className="relative">
        <Overlay />
      </main>
    )
  }

  if (reduced) {
    return (
      <main className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-30 md:opacity-100"
        >
          {/* Distinct keys across branches so switching gives React a fresh
              <canvas> element. Reusing one container makes R3F call
              createRoot() on a node that already has a root. */}
          <Canvas key="reduced" {...CANVAS_PROPS}>
            <Suspense fallback={null}>
              <Lighting />
              <Device desktop={desktop} scrub={false} />
            </Suspense>
          </Canvas>
        </div>
        <div className="relative">
          <Overlay />
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-screen">
      {/* Mobile: the device sits behind the copy at reduced opacity rather than
          stacking, because stacking halves both.
          The dimming MUST target the <canvas> element, not the Canvas
          component's `style` — R3F puts that on the container div, and drei
          injects the `<Scroll html>` overlay into that same container, so
          styling it fades the copy along with the device. */}
      <Canvas
        key="scrub"
        {...CANVAS_PROPS}
        className={desktop ? undefined : 'dim-device'}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={SECTIONS.length} damping={0.25}>
            <Lighting />
            <Device desktop={desktop} scrub />
            <Scroll html>
              <Overlay />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </main>
  )
}
