import type { SectionId } from '@/content/sections'
import type { EmailErrorCode } from '@/lib/schema'

export type SubscribedState = 'confirmed' | 'expired' | 'invalid'

interface StateCopy {
  eyebrow: string
  heading: string
  body: string
}

/**
 * Every visitor-facing string on the site, for one language.
 *
 * `en.ts` and `ru.ts` both satisfy this type, so a key added here without a
 * translation fails the build, and `copy.test.ts` fails a Russian value left
 * identical to its English one unless the key is on its allow-list.
 */
export interface SiteCopy {
  meta: {
    title: string
    description: string
    subscribedTitle: string
  }
  sections: Record<
    SectionId,
    {
      /** Screen-reader name of the stage, e.g. "Stage one". */
      eyebrow: string
      /** Name in the visual `01 / 05 · CASING` label. */
      stage: string
      heading: string
      body: string
    }
  >
  /** The device's LCD. Labels stay in the segment font in every language. */
  lcd: {
    label: string
    button: string
    busy: string
    /**
     * Font for LCD messages. DSEG14 has Latin glyphs only, so a language
     * written in another script shows its messages in Geist Mono instead.
     */
    messageFont: 'segment' | 'mono'
    joined: string
    checkoutFailed: string
    errors: Record<EmailErrorCode, string>
  }
  subscribed: {
    states: Record<SubscribedState, StateCopy>
    back: string
  }
  email: {
    subject: string
    preview: string
    eyebrow: string
    lcdLabel: string
    lcdValue: string
    heading: string
    body: string
    button: string
    fallbackHint: string
    expiry: (days: number) => string
    footer: string
  }
  credits: {
    /** Joins a work's title to its author, spaces included. */
    by: string
    modified: string
  }
  switcher: {
    /** Accessible name of the language switch. */
    label: string
  }
}

/**
 * The part of the dictionary the landing page's client components need.
 * Everything here is plain data, so it can cross the server→client boundary
 * (the full dictionary cannot: `email.expiry` is a function).
 */
export type PageCopy = Pick<SiteCopy, 'sections' | 'lcd' | 'credits' | 'switcher'>
