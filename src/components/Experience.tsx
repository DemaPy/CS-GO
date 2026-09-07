'use client'

import { Scroll, ScrollControls, useScroll } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'

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
const FINAL_OFFSET = new Vector3(0, 0, 0.135)

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
  const scroll = useScroll()

  // Scratch vectors, reused every frame so the scrub allocates nothing.
  const anchor = useRef(new Vector3())
  const finalPos = useRef(new Vector3())
  const pos = useRef(new Vector3())
  const target = useRef(new Vector3())

  const base = useMemo(() => baseTarget(desktop), [desktop])

  /** Places the camera for a given progress. Pure — no accumulated state. */
  function frame(progress: number) {
    rig.seek(progress)
    rig.root.updateMatrixWorld(true)

    const t = smoothstep(subProgress(progress, CAMERA_PUSH))
    rig.displayAnchor.getWorldPosition(anchor.current)

    finalPos.current.copy(anchor.current).add(FINAL_OFFSET)
    pos.current.lerpVectors(BASE_POS, finalPos.current, t)
    target.current.lerpVectors(base, anchor.current, t)

    camera.position.copy(pos.current)
    camera.lookAt(target.current)
  }

  // Reduced motion: assemble once, at the end state, and stop.
  useEffect(() => {
    if (!scrub) frame(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrub, desktop])

  useFrame(() => {
    if (scrub) frame(scroll.offset)
  })

  return <primitive object={rig.root} />
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
