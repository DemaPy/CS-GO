import { z } from 'zod'

import { DEFAULT_LOCALE, LOCALES } from '@/i18n/locales'

/** RFC-practical upper bound on an address. */
const EMAIL_MAX = 254

/**
 * Deliberately not a full RFC 5322 grammar. Anything stricter rejects valid
 * addresses; anything looser is not worth the characters. The provider is the
 * real authority on deliverability.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * One schema, two call sites: the panel's submit handler and the route handler
 * both import this. A second copy would drift, and the drift would show up as
 * a client that accepts what the server rejects.
 *
 * Issues carry a stable code, not prose: each language's dictionary
 * (`src/content/copy`) maps every code to its own text, so a new code with no
 * translation fails the build. The texts say what to fix, never apologise, and
 * never say "something went wrong".
 */
export const EMAIL_ERROR_CODES = [
  'empty',
  'too_long',
  'missing_at',
  'double_at',
  'no_local',
  'no_domain',
  'domain_no_dot',
  'domain_stray_dot',
  'invalid',
] as const
export type EmailErrorCode = (typeof EMAIL_ERROR_CODES)[number]

export const CaptureInput = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((value, ctx) => {
      const reject = (message: EmailErrorCode) =>
        ctx.addIssue({ code: 'custom', message })

      if (value.length === 0) return reject('empty')
      if (value.length > EMAIL_MAX) return reject('too_long')

      const at = value.indexOf('@')
      if (at === -1) return reject('missing_at')
      if (value.indexOf('@', at + 1) !== -1) {
        return reject('double_at')
      }

      const local = value.slice(0, at)
      const domain = value.slice(at + 1)
      if (local.length === 0) return reject('no_local')
      if (domain.length === 0) return reject('no_domain')
      if (!domain.includes('.')) {
        return reject('domain_no_dot')
      }
      if (domain.startsWith('.') || domain.endsWith('.')) {
        return reject('domain_stray_dot')
      }
      if (!EMAIL_SHAPE.test(value)) {
        return reject('invalid')
      }
    }),
  /** Language the visitor signed up in; picks the confirmation email's copy. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
})

export type CaptureInput = z.infer<typeof CaptureInput>

function isEmailErrorCode(value: unknown): value is EmailErrorCode {
  return (EMAIL_ERROR_CODES as readonly unknown[]).includes(value)
}

/** First issue code for the email field, or null when the input is valid. */
export function firstEmailError(raw: string): EmailErrorCode | null {
  const result = CaptureInput.safeParse({ email: raw })
  if (result.success) return null
  const message = result.error.issues.find((i) => i.path[0] === 'email')?.message
  return isEmailErrorCode(message) ? message : 'invalid'
}
