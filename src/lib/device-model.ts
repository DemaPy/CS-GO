/**
 * The one switch: does the scene mount a real glTF, or the procedural
 * placeholder rig?
 *
 * This replaces the hardcoded `USE_DEV_MODEL` constant that used to live in
 * `Experience`. Same switch, same job — moved into the environment, because
 * which model is on screen is a deployment fact rather than a source-code one.
 * The local dev asset and the handcrafted production asset are different files
 * on different machines, and `/public/models/` is gitignored, so the answer
 * cannot be committed.
 */

/**
 * The device model, and the default when nothing overrides it.
 *
 * `/public/models/` is gitignored, so this file exists on the machines that
 * built it and nowhere else — a fresh clone gets a 404 here, which
 * `DeviceModelBoundary` turns into the placeholder plus a console line rather
 * than a blank page.
 *
 * Built from the CC-BY "C4 bomb | CS2" download by a Blender pass that groups
 * 430 loose parts into the five `SectionId` sets, pivots each at its own
 * bounding-box centre and bakes the unit conversion into the geometry. See
 * `docs/asset-provenance.md` for the licence and the build.
 */
const DEV_MODEL_URL = '/models/c4-device.glb'

// Next inlines `NEXT_PUBLIC_*` at build time by literal textual substitution,
// so each name has to appear spelled out in source. `process.env[name]` with a
// computed key is not substituted and reads as `undefined` in the browser —
// which would silently mean "placeholder, always", and look exactly like a
// model that failed to load.
const rawSwitch = process.env.NEXT_PUBLIC_USE_DEV_MODEL
const rawUrl = process.env.NEXT_PUBLIC_DEVICE_MODEL_URL

/** Anything a human would write meaning no. */
function isOff(value: string): boolean {
  return value === 'false' || value === '0' || value === 'off' || value === 'no'
}

const flag = (rawSwitch ?? '').trim().toLowerCase()

/**
 * Unset means: on in development, off in production.
 *
 * Both halves are deliberate. On in development so `next dev` shows the real
 * device with no setup — the two rigs are close enough in silhouette that
 * "which one am I looking at" is a real question, and the answer should not
 * depend on remembering to write a line in `.env.local`. Off in production so
 * the un-vetted dev asset cannot reach a deploy by default; shipping a real
 * model there is an explicit act, which is what the old
 * `USE_DEV_MODEL = false` was protecting.
 */
const useModel =
  flag === '' ? process.env.NODE_ENV !== 'production' : !isOff(flag)

/**
 * The model to load, or `null` to use the placeholder rig.
 *
 * Read this, not the env vars. It is the single point where "should there be a
 * real device on screen, and which one" is decided.
 */
export const DEVICE_MODEL_URL: string | null = useModel
  ? (rawUrl ?? '').trim() || DEV_MODEL_URL
  : null

/** One line for the dev-only console notice, so the branch is never a mystery. */
export const DEVICE_MODEL_REASON = DEVICE_MODEL_URL
  ? `loading ${DEVICE_MODEL_URL}`
  : 'placeholder — NEXT_PUBLIC_USE_DEV_MODEL is off'
