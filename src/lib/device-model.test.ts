import { afterEach, describe, expect, it, vi } from 'vitest'

// device-model.ts reads its env vars at module load, so each case stubs the
// environment and imports a fresh copy.
async function load(env: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('@/lib/device-model')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('DEVICE_MODEL_URL', () => {
  it('ships the licensed model in production when the switch is unset', async () => {
    const m = await load({ NODE_ENV: 'production', NEXT_PUBLIC_USE_DEV_MODEL: '', NEXT_PUBLIC_DEVICE_MODEL_URL: '' })
    expect(m.DEVICE_MODEL_URL).toBe('/models/c4-device.glb')
  })

  it('uses the model in development when the switch is unset', async () => {
    const m = await load({ NODE_ENV: 'development', NEXT_PUBLIC_USE_DEV_MODEL: '', NEXT_PUBLIC_DEVICE_MODEL_URL: '' })
    expect(m.DEVICE_MODEL_URL).toBe('/models/c4-device.glb')
  })

  it.each(['false', '0', 'off', 'no', ' OFF '])('falls back to the placeholder when the switch is %j', async (flag) => {
    const m = await load({ NODE_ENV: 'production', NEXT_PUBLIC_USE_DEV_MODEL: flag })
    expect(m.DEVICE_MODEL_URL).toBeNull()
  })

  it('loads an explicitly configured model', async () => {
    const m = await load({ NODE_ENV: 'production', NEXT_PUBLIC_USE_DEV_MODEL: 'true', NEXT_PUBLIC_DEVICE_MODEL_URL: '/models/device.glb' })
    expect(m.DEVICE_MODEL_URL).toBe('/models/device.glb')
  })
})
