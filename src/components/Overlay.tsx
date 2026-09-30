import type { PageCopy } from '@/content/copy'
import { SECTIONS } from '@/content/sections'
import { stageLabel } from '@/content/stage-label'

/**
 * The five scrolling copy blocks (plan Step 5.3).
 *
 * Copy is pinned left at ~34ch and vertically centred; the device holds the
 * right two-thirds on desktop.
 *
 * No entrance animation. The scroll scrub is the page's entire motion budget.
 *
 * Strings come in as `copy`, the active language's dictionary; the section
 * list itself (ids, order) comes from `SECTIONS`.
 */
export function Overlay({ copy }: { copy: PageCopy }) {
  return (
    <div className="w-screen">
      {SECTIONS.map((section, i) => {
        const isLast = i === SECTIONS.length - 1
        // Section 4's box does not clear the viewport until progress 1.0, so
        // it is still on screen when section 5's copy pins to the top. See
        // the fade in Experience for why that needs a handle.
        const isPenultimate = i === SECTIONS.length - 2
        const text = copy.sections[section.id]
        const label = stageLabel(i, SECTIONS.length, text.stage)
        return (
          <section
            key={section.id}
            aria-labelledby={`heading-${section.id}`}
            className={`flex h-svh w-screen px-6 sm:px-10 lg:px-16 ${
              // Mobile: copy in the bottom band, above the credits and the
              // home indicator; the device owns the top ~58% (framing.ts).
              // Desktop: centred beside the device; section 5 sits above the
              // panel because at full push the panel fills the middle.
              'items-end pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-0'
            } ${isLast ? 'md:items-start md:pt-5' : 'md:items-center'}`}
          >
            {/* Section 5's copy is pinned by Experience once the panel lights.
                Without it, this block slides up through the lit panel across
                0.80-1.00 and only clears the display at exactly 1.0. */}
            <div
              {...(isLast ? { 'data-stage5-copy': '' } : {})}
              {...(isPenultimate ? { 'data-stage4-copy': '' } : {})}
              className={`relative max-w-[34ch] will-change-transform ${
                // Mobile backdrop: full-bleed (cancels the 24/40px gutter),
                // from 3rem above the label down to the bottom edge, with a
                // hairline on top. `will-change-transform` makes this block a
                // stacking context, so the -z-10 pseudo stays behind the
                // text and in front of the canvas. The fade band is a FIXED
                // length (3rem == the -top-12 offset, i.e. exactly the gap
                // above the label), not a percentage stop: a percentage scales
                // with this block's own height, which differs per section, and
                // left the label sitting in the ~36%-opaque part of the fade.
                // A fixed 3rem band puts the transparent-to-opaque transition
                // entirely in the space ABOVE the label, so the label, heading
                // and body always sit on a >=95%-opaque --ground card.
                "before:pointer-events-none before:absolute before:-top-12 before:-left-6 before:-z-10 before:w-screen before:bottom-[calc(-1*(env(safe-area-inset-bottom)+6rem))] before:border-t before:border-rule before:bg-linear-to-b before:from-transparent before:to-ground/95 before:to-[3rem] before:content-[''] sm:before:-left-10 md:before:hidden"
              } ${
                // Desktop-only backdrop for section 5: at full push the camera
                // fills the frame with device texture right behind this block
                // (framing.ts), so the copy needs its own solid card there. A
                // separate ::after (not the mobile ::before, which carries a
                // gradient `background-image` that `bg-ground/95` would not
                // override) sized with a negative inset so the text keeps its
                // current position; `content-['']` is scoped to `md:` so
                // phones never get this pseudo.
                // The bottom side is flush (0, not -1.25rem) rather than
                // matching the other three: the longer stage-5 body (C-copy)
                // pushes this card's natural bottom close to the LCD shell,
                // and a symmetric -inset-5 would eat the >=16px clearance the
                // shell needs (Ruling 21). Top/left/right keep -1.25rem so the
                // label and edges still read as a comfortable card. The
                // section's own `md:pt-5` keeps the card's top edge flush
                // with the viewport (0px, not clipped above it) — it must
                // match the top inset exactly, or the card's top corner
                // scrolls off-screen while the label stays put.
                isLast
                  ? "md:after:pointer-events-none md:after:absolute md:after:-top-5 md:after:-left-5 md:after:-right-5 md:after:bottom-0 md:after:-z-10 md:after:rounded-sm md:after:bg-ground/95 md:after:content-['']"
                  : ''
              }`}
            >
              {/* The mono label is visual; screen readers get the eyebrow
                  ("Stage one"), which reads better than "zero one slash". */}
              <p
                className={`mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-muted ${
                  // Stage 5 only: tighter rhythm below the label claws back a
                  // few px toward the shell clearance (Ruling 21).
                  isLast ? 'md:mb-2' : ''
                }`}
              >
                <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
                <span aria-hidden="true">
                  <span className="text-signal-ink">{label.count}</span> · {label.name}
                </span>
                <span className="sr-only">{text.eyebrow}</span>
              </p>

              <h2
                id={`heading-${section.id}`}
                className="h-display text-[clamp(2.25rem,8vw,4rem)] text-ink"
              >
                {text.heading}
              </h2>

              {/* Every section, including 5: without its body the visitor is
                  never told what the input on the display is for (A9). */}
              <p
                className={`mt-5 text-[17px] leading-[1.55] text-muted md:text-lg ${
                  isLast ? 'md:mt-2' : ''
                }`}
              >
                {text.body}
              </p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
