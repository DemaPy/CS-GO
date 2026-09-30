import { describe, expect, it } from 'vitest'

import { decideLocale } from '@/i18n/route'

const base = { search: '', acceptLanguage: null, cookie: undefined }

describe('decideLocale', () => {
  it('serves /ru paths as they are, whatever the browser says', () => {
    expect(decideLocale({ ...base, pathname: '/ru', acceptLanguage: 'en-US' })).toEqual({ kind: 'next' })
    expect(decideLocale({ ...base, pathname: '/ru/subscribed', cookie: 'en' })).toEqual({ kind: 'next' })
  })

  it('rewrites unprefixed English to the internal /en tree, keeping the query', () => {
    expect(decideLocale({ ...base, pathname: '/', acceptLanguage: 'en-US' })).toEqual({ kind: 'rewrite', to: '/en' })
    expect(decideLocale({ ...base, pathname: '/subscribed', search: '?state=expired' })).toEqual({
      kind: 'rewrite',
      to: '/en/subscribed?state=expired',
    })
  })

  it('redirects a Russian-reading browser to /ru and keeps UTM parameters', () => {
    expect(
      decideLocale({ ...base, pathname: '/', search: '?utm_source=tiktok&utm_campaign=launch', acceptLanguage: 'uk-UA,uk;q=0.9' }),
    ).toEqual({ kind: 'redirect', to: '/ru?utm_source=tiktok&utm_campaign=launch' })
    expect(decideLocale({ ...base, pathname: '/subscribed', search: '?state=confirmed', acceptLanguage: 'ru' })).toEqual({
      kind: 'redirect',
      to: '/ru/subscribed?state=confirmed',
    })
  })

  it('lets a saved choice beat detection', () => {
    expect(decideLocale({ ...base, pathname: '/', acceptLanguage: 'ru-RU', cookie: 'en' })).toEqual({ kind: 'rewrite', to: '/en' })
    expect(decideLocale({ ...base, pathname: '/', acceptLanguage: 'en-US', cookie: 'ru' })).toEqual({ kind: 'redirect', to: '/ru' })
  })

  it('ignores an unknown cookie value and falls back to detection', () => {
    expect(decideLocale({ ...base, pathname: '/', acceptLanguage: 'ru', cookie: 'de' })).toEqual({ kind: 'redirect', to: '/ru' })
  })

  it('redirects explicit /en URLs to their unprefixed canonical form', () => {
    expect(decideLocale({ ...base, pathname: '/en' })).toEqual({ kind: 'redirect', to: '/' })
    expect(decideLocale({ ...base, pathname: '/en/subscribed', search: '?state=invalid' })).toEqual({
      kind: 'redirect',
      to: '/subscribed?state=invalid',
    })
  })

  it('does not mistake look-alike paths for locale prefixes', () => {
    expect(decideLocale({ ...base, pathname: '/rules' })).toEqual({ kind: 'rewrite', to: '/en/rules' })
    expect(decideLocale({ ...base, pathname: '/english' })).toEqual({ kind: 'rewrite', to: '/en/english' })
  })
})
