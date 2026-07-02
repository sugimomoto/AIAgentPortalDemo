# 実接続 足場づくり requirements（要求内容）

> 作業：実接続スキャフォールド（mock↔real 切替・API Routes・MSAL/Foundry/CData IF 整備）
> 作成日：2026年7月2日　作成者：杉本 和也（実装：Claude）
> 関連：[docs/architecture.md](../../docs/architecture.md) §3–§5 / [docs/functional-design.md](../../docs/functional-design.md) / 初回実装 [.steering/20260701-initial-implementation/](../20260701-initial-implementation/)

---

## 1. 背景・目的

初回実装（フェーズ0〜6）は**すべてモックデータ**でデモが一気通貫する状態まで完了した。
本作業は design.md フェーズ2「実接続への差し替え」の**足場（scaffold）**を作る。

- **クレデンシャル/外部サービスは現時点で未整備**のため、実クレデンシャルでのライブ検証は後日に回す。
- 本作業では「コード・型・API Routes・切替機構・設定手順」を先行整備し、env が揃えば実接続に切り替えられる状態にする。
- **既存のモック動作（デモ）を一切壊さない**ことを最優先とする。

---

## 2. スコープ

### 含む（In）

1. **mock ↔ real 切替機構**：`NEXT_PUBLIC_MOCK_MODE` を実際に機能させる。既定（未設定/`true`）はモック、`false` かつ必要 env が揃う場合のみ実接続経路。
2. **API Routes 実装**（サーバーサイド）：
   - `POST /api/auth/token`：Entra OBO トークン交換（クライアントシークレットはここのみ）
   - `POST /api/agent`：Foundry Agent 呼び出し → SSE で `flow_update` / `consent_required` / `text` / `done` を返す
3. **lib 層のクライアント**：
   - `lib/msal.ts`：`PublicClientApplication` 設定・`loginPopup`/`acquireTokenSilent`
   - `lib/foundry.ts`：`AIProjectClient`（`azure-ai-projects`）でエージェント実行・SSE 生成
4. **hooks の real 経路**：`useAuth`・`useAgent` に real 分岐を追加（**既存インターフェースを維持**し、mock と差し替え可能に）。
5. **型**：`AgentEvent`（SSE イベント）等の共通型追加。
6. **設定手順の整備**：`.env.local.example` 拡充＋セットアップ手順（Entra アプリ登録・Foundry Project endpoint・CData Custom OAuth 登録の要点）を docs 化。

### 含まない（Out）

- 実クレデンシャルでのライブ検証・エンドツーエンドの実データ確認（後日、env 整備後）
- デプロイ設定（Vercel / Azure）※別作業単位
- Salesforce/CData テナント側のデータ整備・OAuth アプリの実登録作業そのもの
- 認証 UI の大幅な作り替え（ログイン画面の見た目は現状維持）

---

## 3. ユーザーストーリー

- **As a** 開発者（杉本）
- **I want to** クレデンシャルが揃う前に実接続のコードと切替機構を用意しておく
- **So that** env を設定するだけで実接続デモに切り替えられ、リハーサル準備を短縮できる

- **As a** 登壇者
- **I want to** 会場ネットワーク障害時に `MOCK_MODE=true` で確実に動くフォールバックを保持したい
- **So that** 実接続が不調でもデモを完遂できる

---

## 4. 受け入れ条件

- [ ] `NEXT_PUBLIC_MOCK_MODE`（既定=モック）で、現行デモが**従来どおり一気通貫**で動作する（回帰なし・既存テスト 55＋8 が green のまま）。
- [ ] `MOCK_MODE=false` のとき、実接続経路（MSAL ログイン → `/api/auth/token` OBO → `/api/agent` SSE → Foundry → CData）が**ビルド・型安全**に通る。
- [ ] 実接続経路は、**同じ UI 状態遷移**（①〜⑤フロー・④コンセント停止・タイプライター）で動くようインターフェースを揃える。
- [ ] クレデンシャル未設定/接続失敗時は**graceful に扱う**（エラー表示、必要ならモックにフォールバック）。ハングやクラッシュをしない。
- [ ] **クライアントシークレットはサーバー（API Route）のみ**で使用し、ブラウザに露出しない。トークンは `sessionStorage`（localStorage 不可）。
- [ ] 新規に追加する純粋ロジック（env 解決・SSE パース・OBO リクエスト組立 等）に**単体テスト**を追加し green。
- [ ] `.env.local.example` と実接続セットアップ手順（Entra/Foundry/CData の要点）が整備されている。

---

## 5. 制約事項

- **新 Foundry（ai.azure.com）前提**：Agent/Responses API の audience は `https://ai.azure.com/.default`。`FOUNDRY_PROJECT_ENDPOINT` は新ポータルの Project endpoint。SDK は `azure-ai-projects`（`AIProjectClient`）。呼び出しユーザーに **Foundry User** ロール。
- **CData は Custom OAuth（OAuth identity passthrough）**：Microsoft の Managed OAuth は不可（`Cannot pass Microsoft token to untrusted MCP endpoint.`）。初回は `oauth_consent_request` を受けてコンセントリンク提示、以降は Foundry が CData Token を保管。
- **セキュリティ**：XSS 対策（Markdown サニタイズは現状維持）、CORS は同一オリジンのみ、最小権限スコープ。
- **非破壊**：既存の `lib/mockData.ts`・`lib/sequence.ts`・UI コンポーネント・モック hooks の挙動を変えない（real は増分で追加）。

---

## 6. 永続ドキュメントへの影響

- `architecture.md` §3–§5・`functional-design.md` は既に実接続アーキテクチャを記述済み → **本作業での変更は原則不要**。
- 実装で仕様の細部（SSE イベント形・フォールバック方針）が確定したら、必要に応じて `architecture.md §4 API 設計` に追記する（軽微）。
- `repository-structure.md` の単一ページ構成への改訂（初回実装で保留中）は本作業とは別件。
