import { describe, expect, it } from 'vitest'

import { isLocale, localeFromAcceptLanguage, localizedPath } from '@/i18n/locales'

describe('localeFromAcceptLanguage', () => {
  it.each([
    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru'],
    ['uk-UA,uk;q=0.9', 'ru'],
    ['be', 'ru'],
    ['bg-BG', 'ru'],
    ['sr-Cyrl-RS', 'ru'],
    ['mk', 'ru'],
    ['kk-KZ', 'ru'],
    ['ky', 'ru'],
    ['uz', 'ru'],
    ['tg', 'ru'],
  ])('%j → ru (Cyrillic-script set)', (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected)
  })

  it.each([
    ['en-US,en;q=0.9', 'en'],
    ['pl-PL,pl;q=0.9', 'en'],
    ['cs', 'en'],
    ['sk', 'en'],
    ['sl', 'en'],
    ['hr', 'en'],
    ['de-DE', 'en'],
  ])('%j → en (not in the Russian set)', (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected)
  })

  it('uses the highest-q language, not the first listed', () => {
    expect(localeFromAcceptLanguage('en;q=0.4, ru;q=0.9')).toBe('ru')
    expect(localeFromAcceptLanguage('ru;q=0.3, pl;q=0.8')).toBe('en')
  })

  it('keeps list order between equal q values', () => {
    expect(localeFromAcceptLanguage('pl-PL, ru;q=0.8')).toBe('en')
    expect(localeFromAcceptLanguage('uk, en')).toBe('ru')
  })

  it('ignores q=0 (explicitly not acceptable) and wildcards', () => {
    expect(localeFromAcceptLanguage('ru;q=0, en')).toBe('en')
    expect(localeFromAcceptLanguage('*, ru;q=0.5')).toBe('ru')
  })

  it('falls back to en for missing or malformed headers', () => {
    expect(localeFromAcceptLanguage(null)).toBe('en')
    expect(localeFromAcceptLanguage('')).toBe('en')
    expect(localeFromAcceptLanguage(';;;,,,q=abc')).toBe('en')
    expect(localeFromAcceptLanguage('RU')).toBe('ru')
  })
})

describe('localizedPath', () => {
  it('leaves English unprefixed and prefixes Russian', () => {
    expect(localizedPath('en', '/')).toBe('/')
    expect(localizedPath('en', '/subscribed')).toBe('/subscribed')
    expect(localizedPath('ru', '/')).toBe('/ru')
    expect(localizedPath('ru', '/subscribed')).toBe('/ru/subscribed')
  })
})

describe('isLocale', () => {
  it('accepts only supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ru')).toBe(true)
    expect(isLocale('uk')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})
