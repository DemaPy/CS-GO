import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCopy, type SubscribedState } from '@/content/copy'
import { isLocale, localizedPath } from '@/i18n/locales'

export async function generateMetadata({ params }: PageProps<'/[lang]/subscribed'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return {
    title: getCopy(lang).meta.subscribedTitle,
    robots: { index: false, follow: false },
  }
}

function toState(value: string | undefined): SubscribedState {
  return value === 'expired' || value === 'invalid' ? value : 'confirmed'
}

export default async function Subscribed({ params, searchParams }: PageProps<'/[lang]/subscribed'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const query = await searchParams
  const raw = Array.isArray(query.state) ? query.state[0] : query.state
  const copy = getCopy(lang).subscribed
  const { eyebrow, heading, body } = copy.states[toState(raw)]

  return (
    // Mobile: the block sits in the bottom band, like the landing page.
    // Desktop: vertically centred. No 3D: this page must load instantly.
    <main className="flex min-h-svh items-end px-6 pb-[calc(env(safe-area-inset-bottom)+3rem)] sm:px-10 md:items-center md:pb-0 lg:px-16">
      <div className="max-w-[40ch]">
        <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
          <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
          {eyebrow}
        </p>

        <h1 className="h-display text-[clamp(2.25rem,8vw,3.5rem)] text-ink">{heading}</h1>

        <p className="mt-5 text-[17px] leading-[1.55] text-muted md:text-lg">{body}</p>

        <p className="mt-10">
          <Link
            href={localizedPath(lang, '/')}
            className="inline-flex min-h-11 items-center text-base text-signal-ink underline decoration-signal underline-offset-4 hover:text-ink"
          >
            {copy.back}
          </Link>
        </p>
      </div>
    </main>
  )
}
