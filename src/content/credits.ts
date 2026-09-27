/**
 * Attribution that the site is legally required to display.
 *
 * The device model is CC-BY. That licence permits the commercial use this page
 * makes of it **only while** the credit is shown — it is a condition, not a
 * courtesy, so this is not decoration and must not be removed to tidy the
 * design. See `docs/asset-provenance.md`.
 *
 * The font is SIL OFL, which requires the licence to travel with the font
 * (it does: `public/fonts/DSEG-LICENSE.txt`) rather than a visible credit.
 * It is named here anyway, because one honest line covering both is cheaper to
 * keep true than two rules about which credits are mandatory.
 */
export interface Credit {
  /** The work, as its author titled it. */
  title: string
  author: string
  /** Where the work came from. `null` until the listing URL is to hand. */
  href: string | null
  licence: string
  licenceHref: string
  /**
   * CC BY 4.0 §3(a)(1)(B): say if the work was modified. The GLB is the
   * download regrouped into five animation sets by tools/build_device_glb.py.
   */
  modified?: string
}

export const CREDITS: Credit[] = [
  {
    title: 'C4 bomb | CS2',
    author: 'Alex',
    // TODO(credits): paste the Sketchfab listing URL. CC-BY asks for a link to
    // the work where one is reasonable, and one is reasonable here.
    href: null,
    licence: 'CC BY 4.0',
    licenceHref: 'https://creativecommons.org/licenses/by/4.0/',
    modified: 'regrouped for animation',
  },
  {
    title: 'DSEG14 Classic',
    author: 'keshikan',
    href: 'https://www.keshikan.net/fonts-e.html',
    licence: 'SIL OFL 1.1',
    licenceHref: 'https://openfontlicense.org/',
  },
]
