import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Tailwind v4 silently emits nothing for an unknown class (C3), so a missed
// migration renders colourless instead of failing the build. This is the check.
const OLD = '(?:surface|canvas|brass|amber|paper)'
const PATTERNS: [string, RegExp][] = [
  ['old utility', new RegExp(`\\b(?:text|bg|border|decoration|outline|ring|fill|stroke|divide|shadow|accent|caret|placeholder|from|to|via)-${OLD}\\b`)],
  ['old custom property', new RegExp(`--${OLD}\\b`)],
  ['default-palette amber', /\b(?:text|bg|border|decoration|ring|fill|stroke|from|to|via)-amber-\d{2,3}\b/],
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

describe('old palette is gone', () => {
  it('no source file uses an old token name', () => {
    const src = join(process.cwd(), 'src')
    const hits: string[] = []
    for (const file of files(src)) {
      if (file.endsWith('palette-guard.test.ts')) continue
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        for (const [what, re] of PATTERNS) {
          if (re.test(line)) hits.push(`${relative(src, file)}:${i + 1} ${what}: ${line.trim()}`)
        }
      })
    }
    expect(hits).toEqual([])
  })
})
