'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'

import { BACK_WALL_SHADOW as S, SHADOW_ROTATION } from '@/three/shadow'
import { WallContactShadows } from '@/three/WallContactShadows'

/**
 * A light studio, rendered locally: two soft Lightformer panels (a key above
 * and to the right, a fill on the left) baked into an environment map, plus one
 * directional key for form. No `files`/`preset`, so nothing is downloaded
 * (C13). The env's cube camera has far=1000, so every panel sits within
 * 1000 mm of the origin.
 *
 * Replaces the old olive ambient and brass bounce, which were tuned for an
 * olive-black ground.
 */
export function StudioLighting({ progress }: { progress?: RefObject<number> }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[260, 320, 420]} scale={[420, 260, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[-420, 60, 300]} scale={[260, 420, 1]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[0.5, 0.6, 0.7]} intensity={1.6} />
      <BackWallShadow progress={progress} />
    </>
  )
}

/**
 * Re-renders only while the assembly is moving.
 *
 * `frames={Infinity}` re-renders the whole scene with an override material
 * every frame (C19). The frame counter restarts whenever `frames` changes, so
 * when `moving` flips to false that re-render paints exactly one more frame at
 * the resting pose. It flips back the moment progress moves. StudioLighting
 * mounts with the rig, after the model has loaded, so the first frames already
 * see the device.
 */
function BackWallShadow({ progress }: { progress?: RefObject<number> }) {
  const last = useRef<number | null>(null)
  const [moving, setMoving] = useState(true)

  useFrame(() => {
    const p = progress?.current ?? 1
    const changed = last.current === null || Math.abs(p - last.current) > 1e-5
    last.current = p
    if (changed !== moving) setMoving(changed)
  })

  return (
    <WallContactShadows
      position={[0, 0, S.z]}
      rotation={SHADOW_ROTATION}
      scale={S.scale}
      far={S.far}
      opacity={S.opacity}
      blur={S.blur}
      resolution={S.resolution}
      frames={moving ? Infinity : 1}
    />
  )
}
