import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'x'.repeat(40)

// The secret is read at module load, so each test imports a fresh copy.
async function load() {
  vi.resetModules()
  vi.stubEnv('CAPTURE_LINK_SECRET', SECRET)
  return import('@/lib/consent-token')
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** A token in the pre-locale format: `{ e, x }` only, signed with the real key. */
function legacyToken(email: string, expires: number): string {
  const payload = b64url(JSON.stringify({ e: email, x: expires }))
  return `${payload}.${b64url(createHmac('sha256', SECRET).update(payload).digest())}`
}

beforeEach(() => vi.useRealTimers())
afterEach(() => vi.unstubAllEnvs())

describe('consent token locale', () => {
  it('round-trips the signup locale', async () => {
    const { mintConsentToken, readConsentToken } = await load()
    const token = mintConsentToken('alex@example.com', 'ru')
    expect(readConsentToken(token)).toEqual({ ok: true, email: 'alex@example.com', locale: 'ru' })
  })

  it('defaults to en when minted without a locale', async () => {
    const { mintConsentToken, readConsentToken } = await load()
    expect(readConsentToken(mintConsentToken('alex@example.com'))).toMatchObject({ ok: true, locale: 'en' })
  })

  it('reads links minted before the locale field existed as English', async () => {
    const { readConsentToken } = await load()
    const token = legacyToken('old@example.com', Date.now() + 60_000)
    expect(readConsentToken(token)).toEqual({ ok: true, email: 'old@example.com', locale: 'en' })
  })

  it('rejects a token whose locale was edited', async () => {
    const { mintConsentToken, readConsentToken } = await load()
    const [payload, signature] = mintConsentToken('alex@example.com', 'en').split('.')
    const edited = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    edited.l = 'ru'
    expect(readConsentToken(`${b64url(JSON.stringify(edited))}.${signature}`)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
  })

  it('still expires', async () => {
    const { mintConsentToken, readConsentToken } = await load()
    const token = mintConsentToken('alex@example.com', 'ru', 0)
    expect(readConsentToken(token)).toEqual({ ok: false, reason: 'expired' })
  })
})
