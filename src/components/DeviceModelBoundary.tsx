'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Rendered instead of `children` once anything below has thrown. */
  fallback: ReactNode
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Keeps a bad model from taking the page down with it.
 *
 * Loading a real device is the one part of this scene that depends on a file
 * nobody in this repo controls. Two things throw during render when that file
 * is wrong, and both are ordinary rather than exotic:
 *
 * - `useGLTF` rejects — the URL 404s, the server returns HTML, the buffer is
 *   not a glTF. Any deploy where the model was not uploaded does this.
 * - `createGltfRig` throws — the scene graph is missing one of the five
 *   `SectionId` groups or the `DisplayAnchor` node. Any export that renamed or
 *   merged a node does this, which is most of them the first time.
 *
 * Without a boundary either one unmounts the whole Canvas subtree, so the
 * visitor gets a blank page with copy scrolling over nothing — a failure that
 * looks like a broken site rather than a missing asset. With it, the scene
 * falls back to the procedural rig: the page still assembles, still scrolls,
 * still takes an address, and the console says exactly what went wrong.
 *
 * Errors thrown from `useFrame` are NOT caught here — those escape React's
 * render phase entirely. This covers load and construction, which is where a
 * swapped-in model actually fails.
 */
export class DeviceModelBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[device-model] the glTF rig failed to mount — falling back to the ' +
        'procedural placeholder. Check that the model file is where ' +
        'NEXT_PUBLIC_DEVICE_MODEL_URL points (default /models/dev-device.glb), ' +
        'and that it exports one node per SectionId plus a DisplayAnchor:',
      error,
      info.componentStack,
    )
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
