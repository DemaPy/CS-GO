import { render } from '@react-email/render'

import { getCopy } from '@/content/copy'
import { ConfirmAddressEmail } from '@/emails/confirm-address'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'

/**
 * Renders the confirmation email to the two bodies Resend wants.
 *
 * Both come from the same React component, so the plain-text alternative can
 * never drift from the HTML — which is exactly how text parts rot when they
 * are maintained by hand.
 */
export async function renderConsentEmail(
  confirmUrl: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{
  subject: string
  html: string
  text: string
}> {
  const copy = getCopy(locale).email
  const element = ConfirmAddressEmail({ confirmUrl, copy, locale })

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  return {
    subject: copy.subject,
    html,
    text,
  }
}
