import { beforeAll, describe, expect, it } from 'vitest'

import { renderConsentEmail } from '@/lib/consent-email'

const URL_ = 'https://example.test/api/confirm?t=abc.def'

describe('confirmation email', () => {
  let html: string
  let text: string

  beforeAll(async () => {
    ;({ html, text } = await renderConsentEmail(URL_))
  })

  it('the button is signal-ink with white text', () => {
    const anchor = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
      .map((m) => m[0])
      .find((a) => a.includes('Arm subscription'))
    expect(anchor).toBeDefined()
    expect(anchor).toMatch(/background-color:\s*#C73E00/i)
    expect(anchor).toMatch(/[;"]\s*color:\s*#FFFFFF/i)
    expect(anchor).toContain(`href="${URL_.replace(/&/g, '&amp;')}"`)
  })

  it('uses the light palette and none of the old one', () => {
    expect(html).toMatch(/#F5F5F2/i)
    for (const old of ['#12140f', '#1f2319', '#8a6e3b', '#c8862a', '#d8d4c6']) {
      expect(html.toLowerCase()).not.toContain(old)
    }
  })

  it('keeps the email constraints: no images, no classes, no <style>', () => {
    expect(html).not.toMatch(/<img\b/i)
    expect(html).not.toMatch(/\sclass="/i)
    expect(html).not.toMatch(/<style\b/i)
  })

  it('the plain-text part carries the link', () => {
    expect(text).toContain(URL_)
  })
})
