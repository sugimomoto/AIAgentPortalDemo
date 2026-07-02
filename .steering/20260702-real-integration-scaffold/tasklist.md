# 実接続 足場づくり tasklist（タスクリスト）

> 作業：実接続スキャフォールド　作成日：2026年7月2日
> 関連：[requirements.md](./requirements.md) / [design.md](./design.md)
> 進め方：純粋ロジックは TDD（🔴→🟢）。real I/O は型・ビルド・構造で担保（クレデンシャル未整備）。
> 大原則：**既存モック経路と既存テスト（55＋8）を壊さない**。

---

## フェーズ A：基盤（切替・型・依存）

- [x] A-1　依存追加：`@azure/msal-browser` / `azure-ai-projects` / `@azure/core-auth`
- [x] A-2　`lib/types.ts` に `AgentEvent` / `TokenSet` / `OboTokenResponse` を追加
- [x] A-3 🔴🟢　`lib/config.ts`：`isMockMode` / `isRealConfigReady` / `publicConfig` ＋テスト
- [x] A-4　`lib/serverConfig.ts`（`server-only`）：サーバー専用 env の集約

## フェーズ B：純粋ユーティリティ（TDD）

- [x] B-1 🔴🟢　`lib/obo.ts`：`buildOboForm(assertion, cfg)` ＋テスト（grant_type/scope/必須項目）
- [x] B-2 🔴🟢　`lib/sse.ts`：`serializeSse` / `parseSse` ＋テスト（ラウンドトリップ・分割チャンク・複数イベント）

## フェーズ C：API Routes

- [x] C-1　`app/api/auth/token/route.ts`：`buildOboForm` ＋ token endpoint 交換・シークレットはサーバーのみ
- [x] C-2　`app/api/agent/route.ts`：`runAgent` を SSE(`serializeSse`) で返す・error イベントで graceful 終了

## フェーズ D：lib クライアント（real I/O・型/構造担保）

- [x] D-1　`lib/msal.ts`：`getMsalInstance`（SSR ガード）/ `signIn` / `acquireAssertionToken`
- [x] D-2　`lib/foundry.ts`：`createFoundryClient` / `runAgent`（AgentEvent 生成・実 SDK 部は TODO 明示）

## フェーズ E：hooks への real 分岐

- [x] E-1　`useAgent`：options に `mockMode`/`getAccessToken` 追加、`sendReal`/real `approveConsent`（SSE 消費・runId 共有）。**mock 経路は不変**
- [x] E-2　`useAuth`：`mockMode` 分岐、real の `signIn`/`getAccessToken` 公開（ペルソナ表示は維持・per-user 実ログインは TODO）
- [x] E-3　`app/page.tsx`：mock/real で結線切替（real 時のみ `getAccessToken` を渡す）

## フェーズ F：設定手順・仕上げ

- [x] F-1　`.env.local.example` 拡充（コメント・real 切替手順）
- [x] F-2　`docs/setup-real-integration.md`：Entra アプリ登録・Foundry Project endpoint・CData Custom OAuth の要点
- [x] F-3　全チェック green：`test`（既存＋新規）/ `test:e2e`（MOCK）/ `lint` / `typecheck` / `build`
- [x] F-4　`architecture.md §4` に SSE イベント形/フォールバックを軽微追記（必要時）

---

## 完了条件（Definition of Done）

- 既定（モック）で現行デモが回帰なく一気通貫（既存 55＋8 テスト green 維持）。
- `MOCK_MODE=false` の real 経路がビルド・型安全で通る（同一 UI 状態遷移の IF）。
- 追加した純粋ロジック（config/obo/sse）の単体テストが green。
- クライアントシークレット非露出・トークン sessionStorage。
- `.env.local.example` と実接続セットアップ手順が整備済み。
