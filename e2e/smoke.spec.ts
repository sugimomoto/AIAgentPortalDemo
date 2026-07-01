import { test, expect } from '@playwright/test'

// Playwright + dev サーバ + baseURL の疎通確認（フェーズ5で本番シナリオに置換）
test('app boots and serves the root page', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle(/.+/)
})
