import { NextResponse } from 'next/server'
import { z } from 'zod'

import { CaptureInput } from '@/lib/schema'

const API_KEY = process.env.CAPTURE_RESEND_API_KEY
const AUDIENCE_ID = process.env.CAPTURE_RESEND_AUDIENCE_ID

/**
 * Captures the address typed on the device display.
 *
 * The client contract does not change when a provider is added or removed:
 * a valid address always gets `{ ok: true }`, and a provider failure is logged
 * server-side rather than surfaced. That is deliberate — a broken list
 * provider must never block a sale (plan Step 7.5).
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

  if (!API_KEY) {
    // Documented fallback: validate, log, succeed. Keeps the whole flow
    // testable before the provider is wired up.
    console.info('[capture] no CAPTURE_RESEND_API_KEY set; captured', email)
    return NextResponse.json({ ok: true, stored: false })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(API_KEY)

    if (!AUDIENCE_ID) {
      console.info('[capture] no audience configured; captured', email)
      return NextResponse.json({ ok: true, stored: false })
    }

    const { error } = await resend.contacts.create({
      email,
      audienceId: AUDIENCE_ID,
      unsubscribed: false,
    })

    if (error) {
      console.error('[capture] resend rejected the contact:', error)
      return NextResponse.json({ ok: true, stored: false })
    }

    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    console.error('[capture] resend threw:', error)
    return NextResponse.json({ ok: true, stored: false })
  }
}
