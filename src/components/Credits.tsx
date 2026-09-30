'use client'

import type { PageCopy } from '@/content/copy'
import { CREDITS } from '@/content/credits'
import { LOCALE_COOKIE, LOCALES, localizedPath, type Locale } from '@/i18n/locales'

/** A year: long enough that a returning visitor keeps their choice. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * The attribution line, pinned to the bottom of the viewport, with the
 * language switch at its end.
 *
 * Fixed rather than parked in a footer, because this page has no footer — it is
 * five pinned viewports and a scroll scrub, so a credit placed "at the end"
 * would only exist at one scroll position. CC-BY wants the credit visible to a
 * visitor, and the cheapest way to be sure of that is for it never to leave.
 *
 * It sits outside the `<Canvas>` in every branch of `Experience`, so it is
 * unaffected by the scrub and survives the reduced-motion path.
 *
 * The strip sits in the bottom safe area on a light ground.
 */
export function Credits({ copy, locale }: { copy: PageCopy; locale: Locale }) {
  return (
    <aside
      aria-label="Attribution"
      // Full-width strip in the bottom safe area. The copy band's bottom
      // padding (Overlay, 6rem) reserves this strip's height (~81px on a
      // phone, with the switch's 44px tap targets), so they never overlap. Wraps on phones: two nowrap credits overflowed 360px.
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 bg-ground/85 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-[2px] sm:px-10 lg:px-16"
    >
      <p className="font-mono text-[10px] leading-relaxed text-muted">
        {CREDITS.map((credit, i) => (
          <span key={credit.title} className="sm:whitespace-nowrap">
            {i > 0 && <span aria-hidden="true" className="mx-2 text-rule">·</span>}
            {credit.href ? (
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-2 hover:text-ink"
              >
                {credit.title}
              </a>
            ) : (
              <span>{credit.title}</span>
            )}
            <span>
              {copy.credits.by}
              {credit.author},{' '}
            </span>
            <a
              href={credit.licenceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rule underline-offset-2 hover:text-ink"
            >
              {credit.licence}
            </a>
            {credit.modified && <span>, {copy.credits.modified}</span>}
          </span>
        ))}
      </p>
      <LanguageSwitch label={copy.switcher.label} locale={locale} />
    </aside>
  )
}

/**
 * `EN · RU`. A real link, so it works as plain navigation; the click also
 * saves the choice in a cookie, which the proxy honours over browser-language
 * detection. Without the cookie, a Russian-browser visitor clicking EN would be
 * detected straight back to /ru.
 */
function LanguageSwitch({ label, locale }: { label: string; locale: Locale }) {
  return (
    <nav aria-label={label} className="flex shrink-0 font-mono text-[11px] uppercase tracking-[0.08em]">
      {LOCALES.map((target, i) => (
        <span key={target} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="text-rule">·</span>}
          {target === locale ? (
            <span aria-current="true" className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink">
              {target}
            </span>
          ) : (
            <a
              href={localizedPath(target, '/')}
              hrefLang={target}
              lang={target}
              onClick={() => {
                document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted underline decoration-rule underline-offset-2 hover:text-ink"
            >
              {target}
            </a>
          )}
        </span>
      ))}
    </nav>
  )
}
