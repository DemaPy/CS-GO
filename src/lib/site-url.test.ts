import { describe, expect, it } from 'vitest'

import { metadataBaseFrom } from '@/lib/site-url'

describe('metadataBaseFrom (Review Focus 3)', () => {
  it('unset or blank is undefined, so Next falls back to the Vercel production URL (C10)', () => {
    expect(metadataBaseFrom(undefined)).toBeUndefined()
    expect(metadataBaseFrom('')).toBeUndefined()
    expect(metadataBaseFrom('   ')).toBeUndefined()
  })

  it('an absolute http(s) URL is used as is', () => {
    expect(metadataBaseFrom('https://example.com')?.href).toBe('https://example.com/')
    expect(metadataBaseFrom(' http://localhost:3000 ')?.origin).toBe('http://localhost:3000')
  })

  it('a malformed value fails loudly, naming the variable', () => {
    expect(() => metadataBaseFrom('example.com')).toThrow(/CAPTURE_SITE_URL/)
    expect(() => metadataBaseFrom('ftp://example.com')).toThrow(/CAPTURE_SITE_URL/)
  })
})
