import { render } from '@react-email/render'

import { ConfirmAddressEmail } from '@/emails/confirm-address'

/**
 * Renders the confirmation email to the two bodies Resend wants.
 *
 * Both come from the same React component, so the plain-text alternative can
 * never drift from the HTML — which is exactly how text parts rot when they
 * are maintained by hand.
 */
export async function renderConsentEmail(confirmUrl: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const element = ConfirmAddressEmail({ confirmUrl })

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  return {
    // No product name yet — TODO(copy) tracks that in src/content/sections.ts.
    subject: 'Confirm your address',
    html,
    text,
  }
}
