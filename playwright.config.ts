import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * E2E 受け入れテスト設定。
 * デモは会場ネットワーク非依存でも検証できるよう、モックモードで dev サーバを起動する。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // デザインは 1920×1080 固定レイアウト（product-requirements §9）
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // 会場ネットワーク障害時のフォールバックと同じモックモードで検証する
      NEXT_PUBLIC_MOCK_MODE: 'true',
      NEXT_PUBLIC_STEP_DELAY_MS: '80',
    },
  },
})
