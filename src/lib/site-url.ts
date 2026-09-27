/**
 * `metadataBase` from CAPTURE_SITE_URL, the same variable the confirm link uses
 * (A25).
 *
 * Unset or blank returns undefined ON PURPOSE: Next then falls back to
 * VERCEL_PROJECT_PRODUCTION_URL in production. A hardcoded localhost fallback
 * would override that and ship localhost OG URLs with no warning (C10).
 *
 * A malformed value throws: a build that fails naming the variable beats a
 * site whose link previews silently point nowhere.
 */
export function metadataBaseFrom(raw: string | undefined): URL | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`CAPTURE_SITE_URL must be an absolute http(s) URL, got "${raw}"`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`CAPTURE_SITE_URL must be an absolute http(s) URL, got "${raw}"`)
  }
  return url
}
