'use client'

import { initializePaddle, type Environments, type Paddle } from '@paddle/paddle-js'

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV as Environments | undefined
const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID

/** Whether checkout can actually open. False until the env vars are filled. */
export const checkoutConfigured = Boolean(TOKEN && ENVIRONMENT && PRICE_ID)

let pending: Promise<Paddle | undefined> | null = null

/**
 * Loads Paddle.js once, on demand.
 *
 * Lazy on purpose. Paddle.js is a third-party client SDK, and the plan's
 * Step 8.4 sets a Lighthouse ≥ 70 mobile floor — pulling it in at mount would
 * spend that budget on a script that most visitors reach only after five
 * sections of scrolling. Called when the display goes live, so the overlay is
 * warm by the time anyone submits.
 *
 * Memoised because `initializePaddle` warns and refuses on a second call.
 */
export function loadPaddle(): Promise<Paddle | undefined> {
  if (!checkoutConfigured) return Promise.resolve(undefined)
  if (!pending) {
    pending = initializePaddle({
      token: TOKEN as string,
      environment: ENVIRONMENT as Environments,
    }).catch((error) => {
      // Let the next attempt retry rather than caching a rejected promise.
      pending = null
      throw error
    })
  }
  return pending
}

/**
 * Opens the Paddle overlay with the captured address pre-filled.
 *
 * Replaces the plan's Stripe Payment Link redirect: Paddle has no shareable
 * prefillable link, so this is the equivalent. Nothing about it collects card
 * details in this app — Paddle's iframe owns those.
 *
 * Returns false when checkout is not configured, so the caller can tell the
 * visitor something true instead of appearing to hang.
 */
export async function openCheckout(email: string): Promise<boolean> {
  const paddle = await loadPaddle()
  if (!paddle || !PRICE_ID) return false

  paddle.Checkout.open({
    customer: { email },
    items: [{ priceId: PRICE_ID, quantity: 1 }],
    settings: { variant: 'one-page' },
  })
  return true
}
