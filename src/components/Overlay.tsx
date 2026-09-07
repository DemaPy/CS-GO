import { SECTIONS } from '@/content/sections'

/**
 * The five scrolling copy blocks (plan Step 5.3).
 *
 * Copy is pinned left at ~34ch and vertically centred; the device holds the
 * right two-thirds on desktop. Section 5 carries no copy below its heading —
 * the input lives in the 3D scene, not here.
 *
 * No entrance animation. The scroll scrub is the page's entire motion budget.
 */
export function Overlay() {
  return (
    <div className="w-screen">
      {SECTIONS.map((section, i) => {
        const isLast = i === SECTIONS.length - 1
        return (
          <section
            key={section.id}
            aria-labelledby={`heading-${section.id}`}
            className="flex h-screen w-screen items-center px-6 sm:px-10 lg:px-16"
          >
            <div className="max-w-[34ch]">
              {/* Sentence case, not tracked-out caps. The stage number encodes a
                  real assembly sequence, so it is information, not decoration. */}
              <p className="mb-4 text-sm text-amber">
                <span
                  aria-hidden="true"
                  className="mr-3 inline-block w-6 border-t border-brass align-middle"
                />
                {section.eyebrow}
              </p>

              <h2
                id={`heading-${section.id}`}
                className="h-display text-[clamp(2rem,5.2vw,3.75rem)] text-paper"
              >
                {section.heading}
              </h2>

              {!isLast && (
                <p className="mt-5 text-lg leading-relaxed text-paper/70">
                  {section.body}
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
