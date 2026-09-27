import { CREDITS } from '@/content/credits'

/**
 * The attribution line, pinned to the bottom of the viewport.
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
export function Credits() {
  return (
    <aside
      aria-label="Attribution"
      // Full-width strip in the bottom safe area. The copy band's bottom
      // padding (Overlay, 5rem) reserves this strip's height, so they never
      // overlap. Wraps on phones: two nowrap credits overflowed 360px.
      className="fixed inset-x-0 bottom-0 z-10 bg-ground/85 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-[2px] sm:px-10 lg:px-16"
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
            <span> by {credit.author}, </span>
            <a
              href={credit.licenceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rule underline-offset-2 hover:text-ink"
            >
              {credit.licence}
            </a>
            {credit.modified && <span>, {credit.modified}</span>}
          </span>
        ))}
      </p>
    </aside>
  )
}
