import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // The GLB-driven framing and shadow tests project every vertex of the
    // model at hundreds of poses; the default 5s is not enough.
    testTimeout: 60_000,
  },
})
