import { z } from 'zod'

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
 * Messages say what to fix, never apologise, and never say "something went
 * wrong" — the visitor is three characters from a purchase and deserves to
 * know which three.
 */
export const CaptureInput = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((value, ctx) => {
      const reject = (message: string) =>
        ctx.addIssue({ code: 'custom', message })

      if (value.length === 0) return reject('type an address first')
      if (value.length > EMAIL_MAX) return reject('that address is too long')

      const at = value.indexOf('@')
      if (at === -1) return reject('that address is missing an @')
      if (value.indexOf('@', at + 1) !== -1) {
        return reject('that address has more than one @')
      }

      const local = value.slice(0, at)
      const domain = value.slice(at + 1)
      if (local.length === 0) return reject('add the part before the @')
      if (domain.length === 0) return reject('add the domain after the @')
      if (!domain.includes('.')) {
        return reject('the domain needs a dot, like example.com')
      }
      if (domain.startsWith('.') || domain.endsWith('.')) {
        return reject('that domain has a stray dot')
      }
      if (!EMAIL_SHAPE.test(value)) {
        return reject('that address is not a valid email')
      }
    }),
})

export type CaptureInput = z.infer<typeof CaptureInput>

/** First message for the email field, or null when the input is valid. */
export function firstEmailError(raw: string): string | null {
  const result = CaptureInput.safeParse({ email: raw })
  if (result.success) return null
  return (
    result.error.issues.find((i) => i.path[0] === 'email')?.message ??
    'that address is not a valid email'
  )
}
