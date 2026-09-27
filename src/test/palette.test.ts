import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PALETTE } from '@/content/palette'
import { contrast } from '@/test/contrast'

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

function rootVars(): Record<string, string> {
  const block = css.match(/:root\s*{([^}]*)}/)
  if (!block) throw new Error('globals.css has no :root block')
  const vars: Record<string, string> = {}
  for (const m of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[m[1]] = m[2].toUpperCase()
  }
  return vars
}

describe('palette', () => {
  it('globals.css :root matches PALETTE exactly', () => {
    expect(rootVars()).toEqual({
      ground: PALETTE.ground,
      ink: PALETTE.ink,
      muted: PALETTE.muted,
      rule: PALETTE.rule,
      signal: PALETTE.signal,
      'signal-ink': PALETTE.signalInk,
      armed: PALETTE.armed,
    })
  })

  it('text tokens pass WCAG AA on ground', () => {
    expect(contrast(PALETTE.ink, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(PALETTE.muted, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(PALETTE.signalInk, PALETTE.ground)).toBeGreaterThanOrEqual(4.5)
  })

  it('signal passes 3:1 for non-text on ground, and fails text AA (so it stays fills-only)', () => {
    const ratio = contrast(PALETTE.signal, PALETTE.ground)
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThan(4.5)
  })

  it('white on the signal-ink email button passes AA', () => {
    expect(contrast('#FFFFFF', PALETTE.signalInk)).toBeGreaterThanOrEqual(4.5)
  })

  it('LCD alert text (signal on LCD glass) passes AA', () => {
    expect(contrast(PALETTE.signal, PALETTE.lcd)).toBeGreaterThanOrEqual(4.5)
  })

  it('.readout-alert is declared after .readout, unlayered, so it wins (A17)', () => {
    const readout = css.indexOf('.readout {')
    const alert = css.indexOf('.readout-alert {')
    expect(readout).toBeGreaterThan(-1)
    expect(alert).toBeGreaterThan(readout)
    expect(css.slice(alert, css.indexOf('}', alert))).toContain('color: var(--signal)')
  })
})
