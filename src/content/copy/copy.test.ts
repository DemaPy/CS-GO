import { describe, expect, it } from 'vitest'

import { en } from '@/content/copy/en'
import { ru } from '@/content/copy/ru'

/**
 * Keys whose Russian value may equal the English one on purpose: the device's
 * own LCD labels stay in its Latin-only segment font.
 */
const SAME_ON_PURPOSE = new Set(['lcd.label', 'lcd.button', 'lcd.busy', 'lcd.messageFont', 'email.lcdLabel', 'email.lcdValue'])

/** Flattens a dictionary to `path → string`, calling functions with a sample. */
function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  if (typeof value === 'function') return { [prefix]: String((value as (n: number) => string)(7)) }
  const out: Record<string, string> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key))
  }
  return out
}

const EN = flatten(en)
const RU = flatten(ru)

describe('copy dictionaries', () => {
  it('have exactly the same keys', () => {
    expect(Object.keys(RU).sort()).toEqual(Object.keys(EN).sort())
  })

  it('have no empty strings', () => {
    for (const [path, value] of [...Object.entries(EN), ...Object.entries(RU)]) {
      expect(value.trim(), path).not.toBe('')
    }
  })

  it('leave nothing untranslated except the allow-listed device labels', () => {
    const same = Object.keys(EN).filter((path) => EN[path] === RU[path] && !SAME_ON_PURPOSE.has(path))
    expect(same).toEqual([])
  })

  it('Russian uses the correct plural for day counts', () => {
    expect(ru.email.expiry(1)).toBe('Ссылка действует 1 день')
    expect(ru.email.expiry(3)).toBe('Ссылка действует 3 дня')
    expect(ru.email.expiry(7)).toBe('Ссылка действует 7 дней')
  })
})
