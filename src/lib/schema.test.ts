import { describe, expect, it } from 'vitest'

import { CaptureInput, firstEmailError } from '@/lib/schema'

describe('firstEmailError', () => {
  it.each([
    ['', 'empty'],
    [`${'a'.repeat(250)}@x.com`, 'too_long'],
    ['alex', 'missing_at'],
    ['a@b@c.com', 'double_at'],
    ['@example.com', 'no_local'],
    ['alex@', 'no_domain'],
    ['alex@example', 'domain_no_dot'],
    ['alex@example.com.', 'domain_stray_dot'],
    ['alex@exa mple.com', 'invalid'],
  ])('%j → %s', (raw, code) => {
    expect(firstEmailError(raw)).toBe(code)
  })

  it('returns null for a valid address', () => {
    expect(firstEmailError('  Alex@Example.COM ')).toBeNull()
  })
})

describe('CaptureInput locale', () => {
  it('defaults to en and accepts ru', () => {
    expect(CaptureInput.parse({ email: 'a@b.co' }).locale).toBe('en')
    expect(CaptureInput.parse({ email: 'a@b.co', locale: 'ru' }).locale).toBe('ru')
  })

  it('rejects an unsupported locale', () => {
    expect(CaptureInput.safeParse({ email: 'a@b.co', locale: 'de' }).success).toBe(false)
  })
})
