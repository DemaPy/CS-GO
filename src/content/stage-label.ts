/**
 * The mono stage label: `01 / 05 · CASING`.
 *
 * The number comes from the section's position, so adding or reordering a
 * section cannot leave a stale count on screen; the name is the translated
 * stage name from the dictionary. Screen readers get the dictionary's
 * `eyebrow` ("Stage one") instead; see Overlay.
 */
export function stageLabel(
  index: number,
  total: number,
  name: string,
): { count: string; name: string } {
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError(`stage index ${index} is outside 0..${total - 1}`)
  }
  const width = Math.max(2, String(total).length)
  const pad = (n: number) => String(n).padStart(width, '0')
  return { count: `${pad(index + 1)} / ${pad(total)}`, name: name.toUpperCase() }
}
