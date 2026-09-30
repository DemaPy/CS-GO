import { beforeAll, describe, expect, it } from 'vitest'

import { renderConsentEmail } from '@/lib/consent-email'

const URL_ = 'https://example.test/api/confirm?t=abc.def'

describe('confirmation email', () => {
  let subject: string
  let html: string
  let text: string

  beforeAll(async () => {
    ;({ subject, html, text } = await renderConsentEmail(URL_))
  })

  it('has the waitlist subject', () => {
    expect(subject).toBe('Confirm your spot on the waitlist')
  })

  it('the button is signal-ink with white text', () => {
    const anchor = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
      .map((m) => m[0])
      .find((a) => a.includes('Confirm my spot'))
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

  it('has no translucent colours: Outlook drops rgba() entirely', () => {
    expect(html).not.toContain('rgba(')
  })

  it('the plain-text part carries the link', () => {
    expect(text).toContain(URL_)
  })
})

describe('confirmation email in Russian', () => {
  let subject: string
  let html: string
  let text: string

  beforeAll(async () => {
    ;({ subject, html, text } = await renderConsentEmail(URL_, 'ru'))
  })

  it('uses the Russian subject, lang and button', () => {
    expect(subject).toBe('Подтверди своё место в листе ожидания')
    expect(html).toMatch(/<html[^>]*lang="ru"/)
    const anchor = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
      .map((m) => m[0])
      .find((a) => a.includes('Подтвердить место'))
    expect(anchor).toMatch(/background-color:\s*#C73E00/i)
  })

  it('pluralises the expiry and keeps the link in the text part', () => {
    expect(html).toContain('Ссылка действует 7 дней')
    expect(text).toContain(URL_)
  })

  it('carries no English body copy', () => {
    expect(html).not.toContain('Confirm my spot')
    expect(html).not.toContain('One click and you are on the list')
  })
})
