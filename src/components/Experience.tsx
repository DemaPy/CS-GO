'use client'

import { Scroll, ScrollControls, useGLTF, useScroll } from '@react-three/drei'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Object3D, Vector3 } from 'three'

import { Credits } from '@/components/Credits'
import { DeviceModelBoundary } from '@/components/DeviceModelBoundary'
import { DisplayPanel } from '@/components/DisplayPanel'
import { Overlay } from '@/components/Overlay'
import { SECTIONS, subProgress } from '@/content/sections'
import {
  DEVICE_MODEL_REASON,
  DEVICE_MODEL_URL,
} from '@/lib/device-model'
import { useMediaQuery, useReducedMotion } from '@/lib/use-reduced-motion'
import { createGltfRig } from '@/three/assembly/gltf-rig'
import { createPlaceholderRig } from '@/three/assembly/placeholder-rig'
import { smoothstep, type AssemblyRig } from '@/three/assembly/types'
import {
  CAMERA_PUSH,
  FOV,
  BASE_DISTANCE,
  assembledSize,
  cameraPose,
  type CameraPose,
} from '@/three/framing'

/**
 * Scroll range over which section four's copy fades out.
 *
 * Starts where the camera push does, so the two read as one move, and must be
 * *finished* by 0.8321 — the computed progress at which section four's copy
 * block and the pinned section-five block first intersect. A longer, gentler
 * fade does not work: ending at 0.88 leaves section four still 65% opaque when
 * the overlap opens, which is the same collision just fainter. Verified by
 * sweeping progress in steps of 1e-4 and asserting opacity is 0 wherever the
 * two blocks intersect.
 */
const FADE_STAGE_FOUR: [number, number] = [0.8, 0.83]

interface DeviceProps {
  desktop: boolean
  /** When false the rig mounts fully assembled and never scrubs (Step 8.1). */
  scrub: boolean
}

/**
 * Picks the rig.
 *
 * `DEVICE_MODEL_URL` is a module constant — `NEXT_PUBLIC_*` values are inlined
 * at build time — so this branch is fixed for the life of the process. That is
 * load-bearing, not incidental: each child keeps its own stable hook order,
 * which a conditional `useGLTF` inside one component would not.
 *
 * When a model is configured it is still only a *preference*. The boundary
 * demotes it to the placeholder if the file is missing or the export is wrong,
 * so a bad asset costs the device, never the page.
 *
 * There is deliberately NO `<Suspense>` inside the boundary. The obvious
 * version wraps `GltfDevice` in one to keep the pending state local — and it
 * breaks the readout. `DisplayPanel`'s drei `<Html>` attaches to whatever
 * element R3F has `events.connected` to at the moment it mounts, and
 * `ScrollControls` swaps that to its own scrolling div during its effect. An
 * inner boundary changes when the model's subtree commits relative to that
 * swap, so the readout lands in the scrolled container instead of the fixed
 * one: at full scroll it sits exactly `scrollTop` pixels above the viewport
 * (measured: y = 213 without it, y = -3402 with it, scrollTop 3615) and the
 * display is simply not on screen. The outer `<Suspense>` at each call site
 * already covers the load, and covering it twice is what costs the display.
 */
function Device(props: DeviceProps) {
  if (!DEVICE_MODEL_URL) return <PlaceholderDevice {...props} />

  return (
    <DeviceModelBoundary fallback={<PlaceholderDevice {...props} />}>
      <GltfDevice {...props} url={DEVICE_MODEL_URL} />
    </DeviceModelBoundary>
  )
}

function PlaceholderDevice(props: DeviceProps) {
  const rig = useMemo(() => createPlaceholderRig(), [])
  return <DeviceScene {...props} rig={rig} />
}

/** Suspends while the model loads; see `Device` for the boundary around it. */
function GltfDevice({ url, ...props }: DeviceProps & { url: string }) {
  const { scene } = useGLTF(url)
  const rig = useMemo(() => createGltfRig(scene), [scene])
  return <DeviceScene {...props} rig={rig} />
}

function DeviceScene({
  desktop,
  scrub,
  rig,
}: DeviceProps & { rig: AssemblyRig }) {
  useEffect(() => () => rig.dispose(), [rig])

  // Dev-only handle, so the Step 4.5 purity checks can be run against the rig
  // that is actually on screen rather than a reconstruction of it. Stripped
  // from production builds by the NODE_ENV guard.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      ;(globalThis as unknown as { __rig?: AssemblyRig }).__rig = rig
    }
  }, [rig])

  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const scroll = useScroll()

  // Scratch vectors, reused every frame so the scrub allocates nothing.
  const anchor = useRef(new Vector3())

  // Measured once per rig: the assembled box, so the mobile fit uses the real
  // model's size rather than REFERENCE_BOUNDS (A41).
  const device = useMemo(() => assembledSize(rig), [rig])
  const pose = useRef<CameraPose>({ position: new Vector3(), target: new Vector3() })

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
  const stage4 = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const five = stage5.current
    const four = stage4.current
    return () => {
      if (five) five.style.transform = ''
      if (four) four.style.opacity = ''
    }
  }, [scrub, desktop])

  /**
   * Fades section four's copy out as the section-five pin engages.
   *
   * The two collide without this. `pinStageFive` brings section five's copy to
   * the top of the viewport over 0.80-0.85, but section four's box is 100vh in
   * a container that only travels (n-1) viewports, so it does not clear the top
   * until progress 1.0 — the two occupy the same band from about 0.83 to 0.89,
   * and at 0.84 section five's heading lands inside section four's copy block.
   *
   * Fading the outgoing stage is the resolution that keeps the pin's purpose:
   * section five still never slides up through the lit panel. See
   * `FADE_STAGE_FOUR` for why the window is as tight as it is.
   */
  function fadeStageFour(progress: number) {
    if (!stage4.current) {
      stage4.current = document.querySelector<HTMLElement>('[data-stage4-copy]')
    }
    const node = stage4.current
    if (!node) return

    const t = smoothstep(subProgress(progress, FADE_STAGE_FOUR))
    node.style.opacity = String(1 - t)
  }

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
    rig.displayAnchor.getWorldPosition(anchor.current)

    cameraPose(
      progress,
      { width: size.width, height: size.height, desktop },
      anchor.current,
      device,
      pose.current,
    )
    camera.position.copy(pose.current.position)
    camera.lookAt(pose.current.target)

    pinStageFive(progress)
    fadeStageFour(progress)
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
  camera: {
    position: [0, 0, BASE_DISTANCE] as [number, number, number],
    fov: FOV,
    near: 10,
    far: 10000,
  },
} as const

export function Experience() {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 768px)')

  // Which rig is on screen, said out loud once per load. The two rigs are
  // deliberately similar in silhouette, so "is this the model or the boxes?"
  // is a real question to ask of a screenshot — and a mistyped env var looks
  // identical to a model that failed to load. Dev only; stripped from
  // production builds by the NODE_ENV guard.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[device-model]', DEVICE_MODEL_REASON)
    }
  }, [])

  // Both are null until mounted. Rendering the copy alone on the server keeps
  // the content real without a canvas or a progress value in the HTML — the
  // hydration mismatch Step 8.5 forbids.
  if (reduced === null || desktop === null) {
    return (
      <main className="relative">
        <Overlay />
        <Credits />
      </main>
    )
  }

  if (reduced) {
    return (
      <main className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
        >
          {/* Distinct keys across branches so switching gives React a fresh
              <canvas> element. Reusing one container makes R3F call
              createRoot() on a node that already has a root. */}
          {/* Step 8.3: cap retina cost, tighter on phones — the in-app
              webviews are the weakest browsers the site meets (spec §3). */}
          <Canvas
            key="reduced"
            {...CANVAS_PROPS}
            dpr={desktop ? [1, 2] : [1, 1.75]}
          >
            <Suspense fallback={null}>
              <Lighting />
              <Device desktop={desktop} scrub={false} />
            </Suspense>
          </Canvas>
        </div>
        <div className="relative">
          <Overlay />
        </div>
        <Credits />
      </main>
    )
  }

  return (
    <main className="h-screen w-screen">
      {/* Step 8.3: cap retina cost, tighter on phones — the in-app webviews
          are the weakest browsers the site meets (spec §3). */}
      <Canvas
        key="scrub"
        {...CANVAS_PROPS}
        dpr={desktop ? [1, 2] : [1, 1.75]}
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
      {/* Outside the <Canvas> deliberately: inside `<Scroll html>` it would
          ride the scroll and only be on screen for part of the page, which is
          the one thing a required credit may not do. */}
      <Credits />
    </main>
  )
}
