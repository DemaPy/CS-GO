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
    <main className="flex min-h-screen items-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-[40ch]">
        <p className="mb-4 text-sm text-amber">
          <span
            aria-hidden="true"
            className="mr-3 inline-block w-6 border-t border-brass align-middle"
          />
          {eyebrow}
        </p>

        <h1 className="h-display text-[clamp(2rem,5.2vw,3.5rem)] text-paper">
          {heading}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-paper/70">{body}</p>

        <p className="mt-10">
          <Link
            href="/"
            className="border-b border-brass pb-1 text-base text-paper/80"
          >
            Back to the device
          </Link>
        </p>
      </div>
    </main>
  )
}
