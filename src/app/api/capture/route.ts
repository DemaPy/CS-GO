import { NextResponse } from 'next/server'
import { z } from 'zod'

import { renderConsentEmail } from '@/lib/consent-email'
import { consentSigningAvailable, mintConsentToken } from '@/lib/consent-token'
import { CaptureInput } from '@/lib/schema'

const API_KEY = process.env.CAPTURE_RESEND_API_KEY
const FROM = process.env.CAPTURE_FROM_EMAIL ?? 'onboarding@resend.dev'
const SITE_URL = process.env.CAPTURE_SITE_URL

/**
 * Captures the address typed on the device display and sends a newsletter
 * confirmation email.
 *
 * Double opt-in, running *alongside* checkout rather than gating it: the
 * overlay opens the moment this returns, and marketing consent is earned
 * separately when the visitor clicks the link. Paddle already verifies the
 * buyer at checkout, so gating payment behind an inbox round-trip would cost
 * sales without buying fraud protection.
 *
 * Nothing is added to any audience here. The address only reaches the list
 * after `/api/confirm` verifies a signed link — that is what makes the consent
 * real rather than asserted.
 *
 * The response is always `{ ok: true }` for a valid address, whatever the
 * provider does. A broken provider must not block a sale, and the client
 * contract must not change when one is swapped.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, errors: { email: ['send a JSON body'] } },
      { status: 400 },
    )
  }

  // Same schema the client used. If this rejects what the client accepted, the
  // two have drifted and that is a bug, not a user error.
  const parsed = CaptureInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    )
  }

  const { email } = parsed.data

  if (!consentSigningAvailable) {
    console.error(
      '[capture] CAPTURE_LINK_SECRET missing or too short; no confirmation sent for',
      email,
    )
    return NextResponse.json({ ok: true, invited: false })
  }

  // Prefer an explicit site URL; fall back to the request's own origin so this
  // works in dev and on a preview deploy without another env var to forget.
  const origin = SITE_URL ?? new URL(request.url).origin
  const confirmUrl = `${origin}/api/confirm?t=${encodeURIComponent(mintConsentToken(email))}`

  if (!API_KEY) {
    // Documented fallback: log the link so the whole flow stays testable
    // before a provider or a verified domain exists.
    console.info('[capture] no CAPTURE_RESEND_API_KEY; confirm link:', confirmUrl)
    return NextResponse.json({ ok: true, invited: false })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(API_KEY)

    const { subject, html, text } = await renderConsentEmail(confirmUrl)

    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      // Most likely cause in development: an unverified domain, which limits
      // `onboarding@resend.dev` to the account owner's own address.
      console.error('[capture] resend refused to send:', error)
      if (process.env.NODE_ENV !== 'production') {
        // Keeps the confirm step testable while the domain is unverified.
        // Guarded, because this link grants the consent it represents.
        console.info('[capture] confirm link:', confirmUrl)
      }
      return NextResponse.json({ ok: true, invited: false })
    }

    return NextResponse.json({ ok: true, invited: true })
  } catch (error) {
    console.error('[capture] resend threw:', error)
    return NextResponse.json({ ok: true, invited: false })
  }
}
