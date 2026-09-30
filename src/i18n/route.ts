import { DEFAULT_LOCALE, isLocale, localeFromAcceptLanguage, type Locale } from '@/i18n/locales'

export type LocaleDecision =
  | { kind: 'next' }
  | { kind: 'rewrite'; to: string }
  | { kind: 'redirect'; to: string }

interface LocaleRequest {
  pathname: string
  /** Raw query string including the leading `?`, or empty. Always carried
   *  across, so `utm_*` survives a redirect. */
  search: string
  acceptLanguage: string | null
  /** The `lang` cookie written by the language switch, if any. */
  cookie: string | undefined
}

/** `/ru`, `/ru/…` → 'ru'; anything else → null. Segment-exact, so `/rules` is not Russian. */
function prefixOf(pathname: string): Locale | null {
  const first = pathname.split('/')[1] ?? ''
  return isLocale(first) ? first : null
}

/**
 * What the proxy does with a page request. Pure, so every rule is unit-tested.
 *
 * - `/ru…` is served as is: a URL that names a language wins.
 * - `/en…` redirects to its unprefixed form, so each English page has one URL.
 * - An unprefixed URL takes the saved choice (cookie) if there is one,
 *   otherwise the browser's language. Russian redirects to `/ru…`; English is
 *   rewritten to the internal `/en…` tree without changing the address bar.
 */
export function decideLocale({ pathname, search, acceptLanguage, cookie }: LocaleRequest): LocaleDecision {
  const prefix = prefixOf(pathname)

  if (prefix && prefix !== DEFAULT_LOCALE) return { kind: 'next' }

  if (prefix === DEFAULT_LOCALE) {
    const rest = pathname.slice(`/${DEFAULT_LOCALE}`.length) || '/'
    return { kind: 'redirect', to: `${rest}${search}` }
  }

  const locale = cookie && isLocale(cookie) ? cookie : localeFromAcceptLanguage(acceptLanguage)
  const suffix = pathname === '/' ? '' : pathname

  if (locale === DEFAULT_LOCALE) {
    return { kind: 'rewrite', to: `/${DEFAULT_LOCALE}${suffix}${search}` }
  }
  return { kind: 'redirect', to: `/${locale}${suffix}${search}` }
}
