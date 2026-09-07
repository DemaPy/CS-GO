// TODO(copy): replace once product name and price are confirmed. Every string
// below is the placeholder copy from plan Step 2.2, used verbatim because the
// product questions went unanswered at execution time. Deliberately does not
// name a product — nothing here should read as final.

export type SectionId = 'casing' | 'charges' | 'harness' | 'panel' | 'arm'

export interface Section {
  id: SectionId
  /** inclusive start, exclusive end, of overall scroll progress 0..1 */
  range: [number, number]
  eyebrow: string
  heading: string
  body: string
}

export const SECTIONS: Section[] = [
  {
    id: 'casing',
    range: [0.0, 0.2],
    eyebrow: 'Stage one',
    heading: 'Nothing here is armed yet',
    body: 'A shell, machined and empty. Scroll to build it.',
  },
  {
    id: 'charges',
    range: [0.2, 0.4],
    eyebrow: 'Stage two',
    heading: 'Four charges, seated',
    body: 'Each block locks to a face. The weight is real now.',
  },
  {
    id: 'harness',
    range: [0.4, 0.6],
    eyebrow: 'Stage three',
    heading: 'Wired through',
    body: 'One harness, one path, no redundancy.',
  },
  {
    id: 'panel',
    range: [0.6, 0.8],
    eyebrow: 'Stage four',
    heading: 'The panel goes in',
    body: 'Dark until it has power. It has no reason to trust you yet.',
  },
  {
    id: 'arm',
    range: [0.8, 1.0],
    eyebrow: 'Stage five',
    heading: 'Arm it',
    body: 'Type the address that receives the key.',
  },
]

/** Scroll progress at which the display lights and accepts input. */
export const DISPLAY_LIVE_AT = 0.85

/**
 * The ranges must tile [0, 1] exactly — no gap, no overlap. Every downstream
 * component derives its timing from `SECTIONS`, so a hole here becomes a part
 * that never seats or a section that never scrolls into view.
 *
 * Floating-point literals are compared with an epsilon rather than `===`:
 * 0.6 - 0.4 is not 0.2 in binary, and a future edit to non-fifth boundaries
 * would trip an exact check for no real reason.
 */
function assertContiguous(sections: Section[]): void {
  const EPS = 1e-9
  if (sections.length === 0) throw new Error('SECTIONS is empty')

  const first = sections[0].range[0]
  if (Math.abs(first - 0) > EPS) {
    throw new Error(`SECTIONS must start at 0, got ${first}`)
  }

  const last = sections[sections.length - 1].range[1]
  if (Math.abs(last - 1) > EPS) {
    throw new Error(`SECTIONS must end at 1, got ${last}`)
  }

  for (const { id, range } of sections) {
    if (range[1] <= range[0]) {
      throw new Error(`Section "${id}" has a non-increasing range: ${range}`)
    }
  }

  for (let i = 0; i < sections.length - 1; i++) {
    const end = sections[i].range[1]
    const nextStart = sections[i + 1].range[0]
    if (Math.abs(end - nextStart) > EPS) {
      throw new Error(
        `Gap or overlap between "${sections[i].id}" (ends ${end}) and ` +
          `"${sections[i + 1].id}" (starts ${nextStart})`,
      )
    }
  }

  if (DISPLAY_LIVE_AT < first || DISPLAY_LIVE_AT > last) {
    throw new Error(`DISPLAY_LIVE_AT ${DISPLAY_LIVE_AT} is outside [0, 1]`)
  }
}

if (process.env.NODE_ENV !== 'production') {
  assertContiguous(SECTIONS)
}

export { assertContiguous }

/** Maps overall scroll progress onto a section's own 0..1 sub-progress. */
export function subProgress(progress: number, range: [number, number]): number {
  const [start, end] = range
  const t = (progress - start) / (end - start)
  return t < 0 ? 0 : t > 1 ? 1 : t
}
