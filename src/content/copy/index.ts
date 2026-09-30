import type { Locale } from '@/i18n/locales'

import { en } from './en'
import { ru } from './ru'
import type { PageCopy, SiteCopy } from './types'

export type { PageCopy, SiteCopy, SubscribedState } from './types'

const COPY: Record<Locale, SiteCopy> = { en, ru }

/** The dictionary for a locale. Both are small, so they are imported eagerly. */
export function getCopy(locale: Locale): SiteCopy {
  return COPY[locale]
}

/** The client-safe subset of a dictionary, for the landing page. */
export function getPageCopy(locale: Locale): PageCopy {
  const { sections, lcd, credits, switcher } = COPY[locale]
  return { sections, lcd, credits, switcher }
}
