import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Stateless signed tokens for newsletter confirmation links.
 *
 * No database: the token carries the address and an expiry, and the HMAC makes
 * it unforgeable. That means a confirmation link cannot be guessed, cannot be
 * edited to confirm somebody else's address, and stops working on its own.
 */

const SECRET = process.env.CAPTURE_LINK_SECRET

/** Confirmation links are useless after this long. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export const consentSigningAvailable = Boolean(SECRET && SECRET.length >= 32)

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', SECRET as string).update(payload).digest())
}

/** `<base64url payload>.<base64url hmac>`, safe to put in a URL. */
export function mintConsentToken(email: string, now = Date.now()): string {
  if (!consentSigningAvailable) {
    throw new Error('CAPTURE_LINK_SECRET is missing or shorter than 32 chars')
  }
  const payload = b64url(JSON.stringify({ e: email, x: now + TTL_MS }))
  return `${payload}.${sign(payload)}`
}

export type ConsentResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' | 'unavailable' }

export function readConsentToken(
  token: string,
  now = Date.now(),
): ConsentResult {
  if (!consentSigningAvailable) return { ok: false, reason: 'unavailable' }

  const dot = token.indexOf('.')
  if (dot <= 0 || dot === token.length - 1) {
    return { ok: false, reason: 'malformed' }
  }

  const payload = token.slice(0, dot)
  const provided = token.slice(dot + 1)

  // Compared with timingSafeEqual, not ===, so the comparison cannot be used
  // as an oracle to discover a valid signature byte by byte.
  const expected = sign(payload)
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad-signature' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(fromB64url(payload).toString('utf8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { e?: unknown }).e !== 'string' ||
    typeof (parsed as { x?: unknown }).x !== 'number'
  ) {
    return { ok: false, reason: 'malformed' }
  }

  const { e: email, x: expires } = parsed as { e: string; x: number }
  if (now > expires) return { ok: false, reason: 'expired' }

  return { ok: true, email }
}
