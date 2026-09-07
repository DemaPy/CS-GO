import { NextResponse } from 'next/server'

import { readConsentToken } from '@/lib/consent-token'

const API_KEY = process.env.CAPTURE_RESEND_API_KEY
const AUDIENCE_ID = process.env.CAPTURE_RESEND_AUDIENCE_ID

/**
 * Completes double opt-in: verifies the signed link and *then* adds the
 * address to the audience.
 *
 * This is the only place a contact is created. An address that is never
 * confirmed never reaches the list, which is what makes the consent record
 * defensible rather than a claim.
 *
 * Always redirects to a page rather than returning JSON — a person is clicking
 * this from an email client, not a script.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('t') ?? ''
  const result = readConsentToken(token)

  const done = (state: string) =>
    NextResponse.redirect(new URL(`/subscribed?state=${state}`, url.origin), 303)

  if (!result.ok) {
    // 'expired' earns a distinct message because it is the one failure a
    // legitimate visitor causes, and the fix is theirs: ask again.
    console.info('[confirm] rejected a link:', result.reason)
    return done(result.reason === 'expired' ? 'expired' : 'invalid')
  }

  const { email } = result

  if (!API_KEY || !AUDIENCE_ID) {
    // The consent itself is valid and verified; only the storage is missing.
    console.info(
      '[confirm] verified',
      email,
      '- no audience configured, nothing stored',
    )
    return done('confirmed')
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(API_KEY)

    const { error } = await resend.contacts.create({
      email,
      audienceId: AUDIENCE_ID,
      unsubscribed: false,
    })

    if (error) {
      console.error('[confirm] resend rejected the contact:', error)
      // Still a success from the visitor's side — they did their part, and
      // telling them otherwise invites a pointless second click.
      return done('confirmed')
    }

    return done('confirmed')
  } catch (error) {
    console.error('[confirm] resend threw:', error)
    return done('confirmed')
  }
}
