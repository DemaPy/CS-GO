/**
 * The one switch: does the scene mount a real glTF, or the procedural
 * placeholder rig?
 *
 * This replaces the hardcoded `USE_DEV_MODEL` constant that used to live in
 * `Experience`. It stays an env var so a deployment can still fall back to the
 * placeholder, or point at a different model, without a code change.
 */

/**
 * The device model, and the default when nothing overrides it.
 *
 * Committed: `.gitignore` excludes `/public/models/*` except this one file, so
 * it ships with every deploy. The rejected `dev-device.glb` stays ignored and
 * can never reach a build. A missing or broken file is still demoted by
 * `DeviceModelBoundary` to the placeholder plus a console line, not a blank
 * page.
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
 * Unset means on, in development and production alike.
 *
 * Production used to default to the placeholder, because the only model to
 * hand was the un-vetted dev asset. The default model is now the licensed,
 * committed `c4-device.glb`, credited in `src/content/credits.ts`, so the page
 * ships the real device by default. Set the switch to false/0/off/no to force
 * the placeholder.
 */
const useModel = flag === '' ? true : !isOff(flag)

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
