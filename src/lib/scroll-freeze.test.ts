import { describe, expect, it } from 'vitest'

import {
  FREE,
  RELEASE_MAX_FRAMES,
  progressFor,
  reduceFreeze,
  scrollTopFor,
  type Freeze,
} from '@/lib/scroll-freeze'

describe('scroll freeze', () => {
  it('free passes live progress through', () => {
    expect(progressFor(FREE, 0.42)).toEqual({ progress: 0.42, state: FREE })
  })

  it('focus holds the progress at focus time, whatever live does', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    // Keyboard resize: ScrollControls' offset jumps to ~0.59 (C17).
    expect(progressFor(held, 0.59)).toEqual({ progress: 0.93, state: held })
  })

  it('blur moves to releasing, which holds until live comes back within epsilon', () => {
    let s: Freeze = reduceFreeze(reduceFreeze(FREE, { type: 'focus', progress: 0.93 }), { type: 'blur' })
    expect(s).toEqual({ kind: 'releasing', at: 0.93, frames: 0 })
    let r = progressFor(s, 0.7)
    expect(r.progress).toBe(0.93)
    s = r.state
    r = progressFor(s, 0.9295)
    expect(r).toEqual({ progress: 0.9295, state: FREE })
  })

  it('Review Focus 2: a restore that never converges releases after RELEASE_MAX_FRAMES', () => {
    let s: Freeze = { kind: 'releasing', at: 0.93, frames: 0 }
    for (let i = 0; i < RELEASE_MAX_FRAMES; i++) {
      const r = progressFor(s, 0.5)
      expect(r.progress).toBe(0.93)
      s = r.state
    }
    expect(progressFor(s, 0.5)).toEqual({ progress: 0.5, state: FREE })
  })

  it('Review Focus 1: user scroll while held frees immediately (the caller must not restore)', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    expect(reduceFreeze(held, { type: 'userScroll' })).toEqual(FREE)
    // and the blur that follows the programmatic blur is a no-op
    expect(reduceFreeze(FREE, { type: 'blur' })).toEqual(FREE)
  })

  it('refocus while held keeps the original hold', () => {
    const held = reduceFreeze(FREE, { type: 'focus', progress: 0.93 })
    expect(reduceFreeze(held, { type: 'focus', progress: 0.6 })).toBe(held)
  })

  it('Review Focus 2: scrollTopFor maps a fraction onto the CURRENT scroll length', () => {
    expect(scrollTopFor(0.93, 4220, 844)).toBeCloseTo(0.93 * (4220 - 844), 9)
    // after rotating to landscape the same fraction lands on the new length
    expect(scrollTopFor(0.93, 1950, 390)).toBeCloseTo(0.93 * (1950 - 390), 9)
    expect(scrollTopFor(1.4, 1000, 400)).toBe(600)
    expect(scrollTopFor(-1, 1000, 400)).toBe(0)
    expect(scrollTopFor(0.5, 300, 400)).toBe(0)
  })
})
