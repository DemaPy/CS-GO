'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a media query.
 *
 * Returns `null` during server render and hydration, then the real value.
 * `useSyncExternalStore` is the right primitive here rather than
 * useState-plus-useEffect: the media query *is* an external store, the
 * effect version trips React 19's set-state-in-effect rule, and
 * `getServerSnapshot` gives an explicit hydration value instead of a guess
 * that has to be corrected — which is the mismatch Step 8.5 forbids.
 *
 * Callers must handle `null` by rendering nothing motion-dependent.
 */
export function useMediaQuery(queryString: string): boolean | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const query = window.matchMedia(queryString)
      query.addEventListener('change', onStoreChange)
      return () => query.removeEventListener('change', onStoreChange)
    },
    [queryString],
  )

  // Returns a primitive, so React's referential comparison is stable and this
  // cannot loop.
  const getSnapshot = useCallback(
    () => window.matchMedia(queryString).matches as boolean | null,
    [queryString],
  )

  const getServerSnapshot = useCallback((): boolean | null => null, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** `prefers-reduced-motion: reduce` (plan Step 8.1). */
export function useReducedMotion(): boolean | null {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
