import { NextResponse, type NextRequest } from 'next/server'

import { LOCALE_COOKIE } from '@/i18n/locales'
import { decideLocale } from '@/i18n/route'

/**
 * Locale routing. Every page lives under `app/[lang]/`; this maps public URLs
 * onto it. The rules are in `decideLocale` (unit-tested); this only applies
 * them.
 *
 * Redirects are 307 and carry the full query string, so a UTM-tagged campaign
 * link keeps its attribution when a Russian-reading visitor is sent to `/ru`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const decision = decideLocale({
    pathname,
    search,
    acceptLanguage: request.headers.get('accept-language'),
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
  })

  if (decision.kind === 'next') return NextResponse.next()

  const target = new URL(decision.to, request.url)
  if (decision.kind === 'rewrite') return NextResponse.rewrite(target)

  const response = NextResponse.redirect(target, 307)
  // The answer depends on who is asking; never let a cache replay it to the
  // next visitor.
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Vary', 'Accept-Language, Cookie')
  return response
}

export const config = {
  // Pages only. API routes, Next internals, and anything with a file
  // extension (the model, fonts, favicon, OG image) are left alone.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
