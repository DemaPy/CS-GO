/**
 * Holds scroll progress while the display's input is focused.
 *
 * Android in-app webviews (Instagram, TikTok) are resized by the host app when
 * the keyboard opens, and no viewport meta reaches them (D2). R3F then resizes
 * the canvas; ScrollControls keeps scrollTop in px, so on the next scroll event
 * the offset jumps, e.g. from 0.93 to ~0.59 (C17). That is below
 * DISPLAY_LIVE_AT, so the display goes dark while the visitor is typing.
 *
 * - focus: hold the progress at focus time.
 * - blur: the caller restores scrollTop to the held fraction of the NEW scroll
 *   length, and progress stays held until the live offset has damped back to
 *   within RELEASE_EPSILON, or RELEASE_MAX_FRAMES pass. The cap keeps a restore
 *   that cannot converge (clamped scroll) from freezing the page.
 * - userScroll (touchmove/wheel outside the panel): the visitor is navigating
 *   away. Free immediately, with no restore, or we would fight their scroll.
 */
export type Freeze =
  | { kind: 'free' }
  | { kind: 'held'; at: number }
  | { kind: 'releasing'; at: number; frames: number }

export type FreezeEvent =
  | { type: 'focus'; progress: number }
  | { type: 'blur' }
  | { type: 'userScroll' }

export const FREE: Freeze = { kind: 'free' }
export const RELEASE_EPSILON = 0.002
/** ~2s at 60fps: comfortably longer than ScrollControls' damping of 0.25 needs. */
export const RELEASE_MAX_FRAMES = 120

export function reduceFreeze(state: Freeze, event: FreezeEvent): Freeze {
  switch (event.type) {
    case 'focus':
      return state.kind === 'held' ? state : { kind: 'held', at: event.progress }
    case 'blur':
      return state.kind === 'held' ? { kind: 'releasing', at: state.at, frames: 0 } : state
    case 'userScroll':
      return FREE
  }
}

/** The progress to render this frame, and the state to carry into the next. */
export function progressFor(state: Freeze, live: number): { progress: number; state: Freeze } {
  if (state.kind === 'free') return { progress: live, state }
  if (state.kind === 'held') return { progress: state.at, state }
  if (Math.abs(live - state.at) < RELEASE_EPSILON || state.frames >= RELEASE_MAX_FRAMES) {
    return { progress: live, state: FREE }
  }
  return { progress: state.at, state: { ...state, frames: state.frames + 1 } }
}

/** scrollTop that puts ScrollControls at `fraction` of the current scroll length. */
export function scrollTopFor(fraction: number, scrollHeight: number, clientHeight: number): number {
  const f = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction
  return f * Math.max(0, scrollHeight - clientHeight)
}
