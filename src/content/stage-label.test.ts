import { describe, expect, it } from 'vitest'

import { stageLabel } from '@/content/stage-label'

describe('stageLabel', () => {
  it('zero-pads to two digits and upper-cases the id', () => {
    expect(stageLabel(0, 5, 'casing')).toEqual({ count: '01 / 05', name: 'CASING' })
    expect(stageLabel(4, 5, 'arm')).toEqual({ count: '05 / 05', name: 'ARM' })
  })

  it('pads to the width of the total when it has more digits', () => {
    expect(stageLabel(9, 120, 'x')).toEqual({ count: '010 / 120', name: 'X' })
  })

  it('rejects an index outside the sequence', () => {
    expect(() => stageLabel(5, 5, 'arm')).toThrow(RangeError)
    expect(() => stageLabel(-1, 5, 'arm')).toThrow(RangeError)
  })
})
