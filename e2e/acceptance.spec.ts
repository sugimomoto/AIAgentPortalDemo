import { test, expect, type Page } from '@playwright/test'

// requirements §4 の受け入れ条件シナリオ。
// webServer は playwright.config.ts で MOCK_MODE=true / STEP_DELAY_MS=80 で起動される。

const loginBtn = /Microsoft アカウントでログイン/
const consentBtn = /CData OAuth を承認/
const preset = '今月のパイプラインを見せて'

async function login(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: loginBtn }).click()
  await expect(page.getByText('エージェントに質問する')).toBeVisible()
}

/** プリセット送信 → ④で承認 → 回答（テーブル）確定まで進める */
async function askAndApprove(page: Page) {
  await page.getByRole('button', { name: preset }).click()
  await page.getByRole('button', { name: consentBtn }).click()
  await expect(page.locator('table').last()).toBeVisible({ timeout: 15000 })
}

test('T5-1 ログイン → ポータル遷移', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: loginBtn })).toBeVisible()
  await page.getByRole('button', { name: loginBtn }).click()
  await expect(page.getByText('エージェントに質問する')).toBeVisible()
  await expect(page.getByText('Inside the Agent')).toBeVisible()
})

test('T5-2 田中でプリセット送信 → 8件・¥79,000,000・①〜⑤完了', async ({ page }) => {
  await login(page)
  await askAndApprove(page)

  await expect(page.getByText('適用フィルタ:')).toBeVisible({ timeout: 15000 })
  const bubble = page.locator('.md-body')
  await expect(bubble.getByText('8件')).toBeVisible()
  await expect(bubble.getByText('¥79,000,000')).toBeVisible()

  // 商談テーブルは 8 行
  await expect(page.locator('table tbody tr')).toHaveCount(8)
  // ①〜⑤ すべて完了バッジ
  await expect(page.getByLabel('完了')).toHaveCount(5)
})

test('T5-3 ④は初回のみ待機停止 → 承認で完了', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: preset }).click()

  // ④ で待機（コンセントボタン出現・待機バッジ・まだテーブル無し）
  await expect(page.getByRole('button', { name: consentBtn })).toBeVisible({ timeout: 15000 })
  await expect(page.getByLabel('待機中')).toHaveCount(1)
  await expect(page.locator('table')).toHaveCount(0)

  // 承認 → 完了
  await page.getByRole('button', { name: consentBtn }).click()
  await expect(page.locator('table')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: consentBtn })).toHaveCount(0)
})

test('T5-4 山田に切替→再送で 16件・履歴保持・④で止まらない', async ({ page }) => {
  await login(page)

  // 1回目（田中）
  await askAndApprove(page)
  await expect(page.locator('table tbody tr')).toHaveCount(8)

  // 山田へ切替
  await page.getByLabel('ユーザー切替').click()
  await page.getByText('山田 花子').click()

  // 2回目（山田）：consentGiven 保持 → ④で止まらない（コンセントボタン出ない）
  await page.getByRole('button', { name: preset }).click()
  await expect(page.getByText('チーム全体の商談を', { exact: false })).toBeVisible({
    timeout: 15000,
  })
  await expect(
    page.getByText('マネージャー権限のため、チーム全員の商談が表示されています。'),
  ).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: consentBtn })).toHaveCount(0)

  // 履歴保持：ユーザー発言バブルが2件（同じプリセット）残っている
  await expect(page.locator('[data-role="user"]').filter({ hasText: preset })).toHaveCount(2)
  // 山田の回答テーブルは 16 行（最新テーブル）
  await expect(page.locator('table').last().locator('tbody tr')).toHaveCount(16)
})

test('T5-5 ⑤フィルタ注記がユーザー連動（田中 owner 固定 / 山田 全担当）', async ({ page }) => {
  await login(page)
  const aside = page.locator('aside') // Inside the Agent パネル

  // 田中
  await askAndApprove(page)
  await expect(aside.getByText("owner = '田中 一郎'")).toBeVisible({ timeout: 15000 })

  // 山田へ切替（送信前でも注記は連動する）
  await page.getByLabel('ユーザー切替').click()
  await page.getByText('山田 花子').click()
  await expect(aside.getByText('全担当（マネージャー権限）')).toBeVisible()
})

test('T5-6 MOCK_MODE でモックデータが表示される', async ({ page }) => {
  await login(page)
  await askAndApprove(page)
  // モック定義の商談名が表示される
  await expect(page.getByText('アクロス 基幹システム更改')).toBeVisible({ timeout: 15000 })
})
