import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Address confirmed',
  robots: { index: false, follow: false },
}

type State = 'confirmed' | 'expired' | 'invalid'

const COPY: Record<State, { eyebrow: string; heading: string; body: string }> = {
  confirmed: {
    eyebrow: 'Confirmed',
    heading: 'You are on the list',
    body: 'Build notes and updates only. Every message has an unsubscribe link.',
  },
  expired: {
    eyebrow: 'Link expired',
    heading: 'That link was too old',
    body: 'Confirmation links last seven days. Enter your address again and a fresh one will arrive.',
  },
  invalid: {
    eyebrow: 'Link not valid',
    heading: 'That link did not check out',
    body: 'It may have been broken by your email client. Enter your address again to get a new one.',
  },
}

function toState(value: string | undefined): State {
  return value === 'expired' || value === 'invalid' ? value : 'confirmed'
}

export default async function Subscribed({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const raw = Array.isArray(params.state) ? params.state[0] : params.state
  const state = toState(raw)
  const { eyebrow, heading, body } = COPY[state]

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
            href="/"
            className="inline-flex min-h-11 items-center text-base text-signal-ink underline decoration-signal underline-offset-4 hover:text-ink"
          >
            Back to the device
          </Link>
        </p>
      </div>
    </main>
  )
}
