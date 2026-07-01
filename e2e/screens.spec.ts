import { test, expect } from '@playwright/test'
import path from 'path'

// スクリーンショット出力先（SHOT_DIR で上書き可）。既定は gitignore 済みの screenshots/。
// リポジトリに残す記録は docs/images/screens/ にコピーする。
const DIR = process.env.SHOT_DIR ?? path.join(process.cwd(), 'screenshots')

const shot = (name: string) => path.join(DIR, name)

test('capture 5 demo states', async ({ page }) => {
  // ① ログイン画面
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Microsoft アカウントでログイン/ })).toBeVisible()
  await page.screenshot({ path: shot('1-login.png') })

  // ② ポータル（未応答）
  await page.getByRole('button', { name: /Microsoft アカウントでログイン/ }).click()
  await expect(page.getByText('エージェントに質問する')).toBeVisible()
  await page.screenshot({ path: shot('2-portal-empty.png') })

  // ③ コンセント待ち（④で停止）
  await page.getByRole('button', { name: '今月のパイプラインを見せて' }).click()
  await expect(page.getByRole('button', { name: /CData OAuth を承認/ })).toBeVisible({
    timeout: 15000,
  })
  await page.screenshot({ path: shot('3-consent-waiting.png') })

  // ④ 応答後（田中：8件）
  await page.getByRole('button', { name: /CData OAuth を承認/ }).click()
  await expect(page.getByText('適用フィルタ:')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('table')).toBeVisible()
  await page.screenshot({ path: shot('4-answered-tanaka.png') })

  // ⑤ 山田に切替 → 同じ質問を再送（②④は保持済みなので止まらない）
  await page.getByLabel('ユーザー切替').click()
  await page.getByText('山田 花子').click()
  await page.getByRole('button', { name: '今月のパイプラインを見せて' }).click()
  // 2件目の回答（山田16件）が確定表示されるまで待つ
  await expect(
    page.getByText('マネージャー権限のため、チーム全員の商談が表示されています。'),
  ).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: shot('5-yamada.png') })
})
