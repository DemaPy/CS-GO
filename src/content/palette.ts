/**
 * The light studio palette, as hex, for consumers that cannot read CSS custom
 * properties: the confirmation email (inline styles only) and the OG image
 * (Satori). `globals.css` `:root` is the page's copy of the same table, and
 * `src/test/palette.test.ts` fails if the two drift.
 *
 * `signal` is for FILLS ONLY (3.02:1 on ground). Orange text uses `signalInk`.
 */
export const PALETTE = {
  ground: '#F5F5F2',
  ink: '#111111',
  muted: '#6B6B6B',
  rule: '#E2E2DD',
  signal: '#FF4F00',
  signalInk: '#C73E00',
  armed: '#4EE27B',
  /** The LCD glass. Part of the device, not the page theme. */
  lcd: '#0B0F08',
} as const
