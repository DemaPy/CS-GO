'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Object3D } from 'three'

import { DISPLAY_LIVE_AT } from '@/content/sections'

/** Opacity ramp for the panel lighting up, per plan Step 6.2. */
const FADE_FROM = 0.8
const FADE_TO = 0.9

/**
 * The device's display, as a real DOM input positioned in 3D space.
 *
 * A real `<input type="email">` is non-negotiable (Step 6.1): it brings the
 * correct mobile keyboard, autofill and paste for free. Reimplementing a caret
 * in a texture costs days and loses all three.
 */
export function DisplayPanel({
  progress,
  occludeAgainst,
}: {
  /** Live scroll progress. A ref, not a prop value — this updates every frame
   *  and re-rendering React at 60fps to move an opacity would be absurd. */
  progress: RefObject<number>
  /** The panel mesh, so the readout hides when the panel is behind geometry. */
  occludeAgainst?: RefObject<Object3D | null>
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [live, setLive] = useState(false)
  const [value, setValue] = useState('')

  // Opacity is written straight to the DOM each frame; only the `live`
  // transition crosses back into React, and that happens twice per scroll pass.
  useFrame(() => {
    const p = progress.current ?? 0
    const t = (p - FADE_FROM) / (FADE_TO - FADE_FROM)
    const o = t < 0 ? 0 : t > 1 ? 1 : t

    const shell = shellRef.current
    if (shell) {
      shell.style.opacity = String(o)
      // Inert until lit, so a stray click before section 5 cannot focus it.
      shell.style.pointerEvents = p >= DISPLAY_LIVE_AT ? 'auto' : 'none'
    }

    const nowLive = p >= DISPLAY_LIVE_AT
    if (nowLive !== live) setLive(nowLive)
  })

  // Scrolling back up must surrender focus, or the page keeps typing into an
  // invisible input while the visitor reads section 2.
  useEffect(() => {
    if (!live && inputRef.current === document.activeElement) {
      inputRef.current?.blur()
    }
  }, [live])

  return (
    <Html
      transform
      // drei applies its own px-to-unit ratio on top of `scale`, so this is
      // calibrated by measurement, not derived: 78px at scale 0.0013 rendered
      // ~0.0027 m, i.e. ~2.09 world units per unit of scale per 78px.
      // The shell is 240px here so it can use ordinary font sizes rather than
      // a 5px base magnified 12x; scale drops to match.
      //   240px -> 2.09 * (240/78) = 6.43 units per unit of scale
      //   0.0146 * 6.43 = 0.094 m, just inside the panel's 0.103 m face.
      scale={0.0146}
      // Step 6.4: a raycast approximation, and with the Section 5 camera fixed
      // by Step 5.4 this is a one-time tune rather than a per-frame problem.
      // The cast is safe and the guard is what makes it so: drei's type wants a
      // non-null RefObject, and `.current` is assigned at rig construction.
      occlude={
        occludeAgainst?.current
          ? [occludeAgainst as RefObject<Object3D>]
          : undefined
      }
      style={{ pointerEvents: 'none' }}
    >
      <div
        ref={shellRef}
        aria-hidden={!live}
        style={{ opacity: 0, pointerEvents: 'none' }}
        className="w-[240px] rounded-[4px] border border-black/60 bg-[#0b0f08] px-[16px] py-[14px] shadow-[inset_0_2px_9px_rgba(0,0,0,0.9)]"
      >
        <label
          htmlFor="arm-email"
          className="readout mb-[8px] block text-[10px] opacity-55"
        >
          address
        </label>
        <input
          ref={inputRef}
          id="arm-email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="&mdash;&mdash;&mdash;"
          disabled={!live}
          tabIndex={live ? 0 : -1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          // 14-segment glyphs are wider than 7-segment, so this runs smaller
          // than the label ratio would suggest. Long addresses scroll the
          // input natively rather than overflowing the panel.
          className="readout w-full border-0 bg-transparent p-0 text-[14px] outline-none placeholder:text-[#4ee27b]/25 disabled:cursor-default"
        />
      </div>
    </Html>
  )
}
