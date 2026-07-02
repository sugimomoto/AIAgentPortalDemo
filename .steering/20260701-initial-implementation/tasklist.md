# 初回実装 tasklist（タスクリスト）

> 作業：AI Agent Portal 初回実装　作成日：2026年7月1日　作成者：杉本 和也
> 関連：[requirements.md](./requirements.md) / [design.md](./design.md)
> 進め方：**テストファースト（TDD）**。各ロジックタスクは 🔴 テスト作成 → 🟢 実装で green → ♻️ リファクタ の順。

---

## フェーズ 0：環境セットアップ

> **DevContainer 前提**。以降の作業はコンテナ内で行う。
> 手順：`.devcontainer/devcontainer.json` で「Reopen in Container」→ 中で T0-1 を実行 → 依存導入のためコンテナを Rebuild。

- [x] T0-0　`.devcontainer/devcontainer.json` 作成（Node 20 / port 3000 / 拡張機能 / postCreate で playwright install）
- [x] T0-1　（コンテナ内）Next.js（App Router）+ TypeScript + Tailwind でプロジェクト初期化 → Rebuild で依存導入
  - Next 15.5.19 / React 19.1.0 / TypeScript strict / `src/` / import alias `@/*`
  - Tailwind は仕様（architecture.md §1）どおり **v3.4** を手動導入（`tailwind.config.ts` + `postcss.config.mjs`）
  - `npm run build` green（型チェック・lint 通過）
- [x] T0-2　ESLint / Prettier / tsconfig strict 設定
  - Prettier 3.9（`.prettierrc.json`：semi=false / singleQuote / printWidth=100 / tailwind plugin）＋ `.prettierignore`
  - ESLint に `eslint-config-prettier/flat` と `@typescript-eslint/no-explicit-any: error` を追加
  - scripts 追加：`lint` / `lint:fix` / `typecheck` / `format` / `format:check`
  - tsconfig は scaffold の `strict: true` を採用（既定）
  - 全ファイル整形済み・`lint` / `typecheck` / `format:check` すべて green
- [x] T0-3　テスト基盤導入：**Vitest + React Testing Library + jsdom**（`npm run test`）
  - Vitest 4.1（`vitest.config.ts`：jsdom / globals / `@vitejs/plugin-react` / `@` alias / include=`src/**/*.{test,spec}.{ts,tsx}` / exclude=`e2e`）
  - `vitest.setup.ts`（jest-dom マッチャ登録＋afterEach cleanup）・`vitest-env.d.ts`（globals 型参照）
  - scripts 追加：`test`（run）/ `test:watch`
  - スモークテスト（純粋関数＋RTL レンダリング）で green を確認後に削除
- [x] T0-4　**Playwright** 導入（E2E・`npm run test:e2e`）
  - `@playwright/test` 1.61＋chromium（headless shell）導入
  - `playwright.config.ts`（testDir=`e2e` / baseURL / 1920×1080 / webServer=`npm run dev` を `MOCK_MODE=true`・`STEP_DELAY_MS=80` で起動）
  - `e2e/smoke.spec.ts` で疎通 green・script `test:e2e` 追加
  - `next.config.ts` に `allowedDevOrigins` 追加・`.gitignore`/`.prettierignore` に test 成果物を追加
- [x] T0-5　Noto Sans JP 読み込み・`globals.css`（`.md-body`・`@keyframes`）・`.env.local.example`
  - `layout.tsx` で Noto Sans JP（400/500/600/700）読み込み・`lang="ja"`・metadata
  - `src/styles/globals.css`（Tailwind ディレクティブ＋リセット＋`.md-body`＋keyframes 7種）
  - `.env.local.example` 作成・旧 scaffold の globals/page.module.css 削除・`app/page.tsx` は仮置き
- [x] T0-6　`lib/tokens.ts`（色・寸法定数）・`lib/types.ts`（型定義）
  - `types.ts`：`User`/`Message`/`FlowStep`/`Opportunity`/`SortMode`/`TokenType` ＋シーケンス宣言型（`Participant`/`SeqSection`/`SeqMessage`）
  - `tokens.ts`：`COLORS`/`LAYOUT`/`STAGE_BADGE`/`NOTE_TOKEN_COLORS`/`TIMING`＋`participantCenterX`/`resolveStepDelay`

---

## フェーズ 1：ドメインロジック（純粋関数・TDD）

- [x] T1-1 🔴　`mockData` テスト：16件定義、`filterByUser`（田中8件 / 山田16件）、田中合計 ¥79,000,000
- [x] T1-2 🟢　`lib/mockData.ts` 実装（データ＋`filterByUser`）
- [x] T1-3 🔴　`sortOpportunities` テスト：pipeline=定義順 / amount=降順 / close=昇順
- [x] T1-4 🟢　`sortOpportunities` 実装
- [x] T1-5 🔴　`buildAgentAnswer` テスト：イントロの件数・合計、フィルタ表記、テーブル行数（田中8/山田16）、ステージバッジ HTML
- [x] T1-6 🟢　`buildAgentAnswer` 実装
- [x] T1-7 🔴🟢　`lib/sequence.ts`：参加者6者・①〜⑤メッセージ定義＋⑤フィルタ注記のユーザー差し替えテスト

---

## フェーズ 2：フロー状態機械（TDD・fake timers）

- [x] T2-1 🔴　`useAgentFlow` テスト：初期 `[idle×5]`、step0→4 が processing→done の順に遷移
- [x] T2-2 🟢　`useAgentFlow` 実装
- [x] T2-3 🔴　`send` テスト：ユーザー発言追加・`querying`/`thinking` 立ち上げ・`sortMode` 反映
- [x] T2-4 🔴　④待機テスト：`consentGiven=false && requireConsent=true` で step3 が `waiting` 停止・`awaitingConsent=true`
- [x] T2-5 🔴　`approveConsent` テスト：step3→step4→`finish` 再開、`consentGiven` 保持で2回目は止まらない
- [x] T2-6 🔴　`runId` テスト：再送時に古い非同期処理が無効化される
- [x] T2-7 🟢　`useAgent`（`send`/`approveConsent`/`finish`・`runId`・`stepDelay`）実装 → 上記 green
- [x] T2-8 🔴🟢　`finish` テスト＆実装：タイプライター（22ms/文字）→ 250ms 後テーブル一括追加
- [x] T2-9 🔴🟢　`useAuth`（モック：`login`/`logout`/`selectUser`・履歴保持）テスト＆実装

---

## フェーズ 3：UI コンポーネント（挙動を RTL でテスト → 実装）

- [x] T3-1 🔴🟢　ログイン画面：Microsoft ボタン押下で `portal` 遷移
- [x] T3-2 🔴🟢　`Header`：ユーザー切替ドロップダウン開閉・選択で `user` 変更・ログアウト
- [x] T3-3 🔴🟢　`ChatInput`/`PresetButtons`：busy 中 disabled・プリセットが `sortMode` 連動送信
- [x] T3-4 🔴🟢　`MessageBubble`：Markdown レンダリング（react-markdown + remark-gfm）＋ステージバッジ span 許可・streaming キャレット
- [x] T3-5 🔴🟢　`MessageList`：空状態プレースホルダ・新着自動スクロール・思考ドット
- [x] T3-6 🟢　`InsideAgentPanel` 群：`ParticipantHeader`/`Lifeline`/`SequenceSection`/`SequenceMessage`/`TokenBadge`/`ConsentButton`/`TokenLegend` を sequence 定義から描画
- [x] T3-7 🔴🟢　`ConsentButton`：`awaitingConsent` 時のみ表示・押下で `approveConsent`
- [x] T3-8 🟢　`app/portal/page.tsx` で全ブロック結線・ルート state 保持

---

## フェーズ 4：デザイン忠実化（目視 + スクリーンショット）

- [x] T4-1　`design_handoff/AI Agent Portal.dc.html` と並べて配色・余白・寸法を突き合わせ調整
- [x] T4-2　`@keyframes`（seqPulse/consentGlow/bounceDot/blinkCaret 等）の動きを確認
- [x] T4-3　進行中セクションの自動スクロール（`data-sec` offsetTop）を確認
- [x] T4-4　Playwright スクリーンショットで 5 状態（ログイン/未応答/応答後/コンセント待ち/山田切替後）を記録

---

## フェーズ 5：E2E 受け入れテスト（Playwright・requirements §4 対応）

- [x] T5-1 🔴🟢　ログイン → ポータル遷移
- [x] T5-2 🔴🟢　田中でプリセット送信 → 8件・合計 ¥79,000,000・①〜⑤進行
- [x] T5-3 🔴🟢　④が初回のみ `⏳` 停止 → コンセント承認 → 完了
- [x] T5-4 🔴🟢　山田に切替 → 同じ質問再送 → 16件・**履歴保持**・④で止まらない
- [x] T5-5 🔴🟢　⑤フィルタ注記のユーザー連動（田中 owner 固定 / 山田 全担当）
- [x] T5-6 🔴🟢　`NEXT_PUBLIC_MOCK_MODE=true` でモックデータ表示

---

## フェーズ 6：仕上げ

- [x] T6-1　テスト方針を永続ドキュメントに反映済み（[development-guidelines.md](../../docs/development-guidelines.md) §5・[architecture.md](../../docs/architecture.md) §9）
- [x] T6-2　`README`（起動方法・`stepDelay`/`MOCK_MODE` の切替）整備
- [x] T6-3　全テスト green・lint/型チェック通過を確認
  - `test` 55件 / `test:e2e` 8件 / `lint` / `typecheck` / `format:check` すべて green
- [ ] T6-4　デモ通しリハーサル（stepDelay=9500 で12分に収まるか）
  - ※登壇者による実機通しリハーサル（7/22 予定）で確認する項目。自動テストでは検証不可。
  - 参考：1クエリの①〜⑤進行は `stepDelay`(9500ms)×5 + 各ステップ間 500ms ≒ 約50秒/クエリ。

---

## 完了条件（Definition of Done）

- requirements §4 の受け入れ条件をすべて満たす
- `npm run test` / `npm run test:e2e` / lint / 型チェックがすべて green
- 1920×1080・Chrome で `design_handoff` に忠実
- モックモードでデモが一気通貫で動作する
