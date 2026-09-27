/**
 * The mono stage label: `01 / 05 · CASING`.
 *
 * Derived from the section's position and id rather than written as copy, so
 * adding or reordering a section cannot leave a stale number on screen. The
 * human-readable `eyebrow` ("Stage one") still exists and is what screen
 * readers get; see Overlay.
 */
export function stageLabel(
  index: number,
  total: number,
  id: string,
): { count: string; name: string } {
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError(`stage index ${index} is outside 0..${total - 1}`)
  }
  const width = Math.max(2, String(total).length)
  const pad = (n: number) => String(n).padStart(width, '0')
  return { count: `${pad(index + 1)} / ${pad(total)}`, name: id.toUpperCase() }
}
