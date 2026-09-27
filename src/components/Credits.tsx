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
 * The scrim is doing real work: at full camera push the frame fills with the
 * device's pale tan and white ribbon, and unbacked text at this size and weight
 * would be unreadable exactly where the visitor has stopped to type.
 */
export function Credits() {
  return (
    <aside
      aria-label="Attribution"
      className="fixed bottom-0 left-0 z-10 max-w-[92vw] px-3 py-2 text-[11px] leading-relaxed"
    >
      <p className="rounded-sm bg-ground/80 px-2 py-1 text-muted backdrop-blur-[2px]">
        {CREDITS.map((credit, i) => (
          <span key={credit.title} className="whitespace-nowrap">
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
          </span>
        ))}
      </p>
    </aside>
  )
}
