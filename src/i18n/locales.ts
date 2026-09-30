/**
 * The site's languages, and how a visitor's browser picks one.
 *
 * English is the default and lives at unprefixed URLs (`/`, `/subscribed`);
 * Russian lives under `/ru`. Detection only ever runs on an unprefixed URL
 * with no saved choice (see `src/i18n/route.ts`), so a campaign link that
 * names a language always lands in that language.
 */

export const LOCALES = ['en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie written by the language switch. An explicit choice beats detection. */
export const LOCALE_COOKIE = 'lang'

/**
 * Browser languages that get the Russian site: Cyrillic-script languages and
 * the post-Soviet languages whose speakers widely read Russian. Latin-script
 * Slavic languages (pl, cs, sk, sl, hr, bs) deliberately get English — many of
 * those readers do not read Russian comfortably.
 */
export const RUSSIAN_READING = new Set([
  'ru', 'uk', 'be', 'bg', 'sr', 'mk', 'kk', 'ky', 'uz', 'tg',
])

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/**
 * The visitor's top language, mapped onto the site's two.
 *
 * Takes the highest-q entry (ties keep list order, as RFC 9110 intends), skips
 * `q=0` and `*`, and looks only at the primary subtag, so `sr-Cyrl-RS` counts
 * as `sr`. Anything missing or unparsable is English.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE

  let best: { tag: string; q: number; index: number } | null = null
  header.split(',').forEach((part, index) => {
    const [rawTag, ...params] = part.trim().split(';')
    const tag = rawTag.trim().toLowerCase()
    if (!/^[a-z]{1,8}(-[a-z0-9]{1,8})*$/.test(tag)) return

    let q = 1
    for (const param of params) {
      const [key, value] = param.trim().split('=')
      if (key === 'q') {
        const parsed = Number(value)
        q = Number.isFinite(parsed) ? parsed : 0
      }
    }
    if (q <= 0) return
    if (!best || q > best.q) best = { tag, q, index }
  })

  if (!best) return DEFAULT_LOCALE
  const primary = (best as { tag: string }).tag.split('-')[0]
  return RUSSIAN_READING.has(primary) ? 'ru' : 'en'
}

/** The public URL of `path` in `locale`: English unprefixed, Russian under /ru. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`
}
