# 技術仕様書

> バージョン：1.0　作成日：2026年7月1日　作成者：杉本 和也

---

## 1. テクノロジースタック

| 層 | 技術 | バージョン | 選定理由 |
|----|------|-----------|---------|
| フレームワーク | Next.js（App Router） | 15.x | API Routes でバックエンドを同梱できる。デプロイが1リポジトリで完結 |
| 言語 | TypeScript | 5.x | 型安全。Foundry SDK・MSAL の型定義を活用 |
| スタイリング | Tailwind CSS + インラインスタイル | 3.x | デザイントークンの忠実な再現。1920px固定レイアウトとの親和性 |
| 認証 | MSAL.js（@azure/msal-browser） | 3.x | Entra ID / OBO フローの公式ライブラリ |
| エージェント | azure-ai-projects（`AIProjectClient`） | 最新 | 新 Foundry Agent Service / Responses API への接続 |
| Markdown | react-markdown + remark-gfm | 最新 | エージェント応答のMarkdownレンダリング（インラインHTML許可設定） |
| フォント | Noto Sans JP（Google Fonts） | — | デザイン仕様に合わせた日本語フォント |

---

## 2. システム構成

```
[ブラウザ]
  Next.js App（1920×1080 固定）
    ├── MSAL.js（Entra ID 認証・OBO トークン管理）
    └── React コンポーネント（チャット UI / Inside the Agent）
          ↓ API Routes 経由
[Next.js API Routes（サーバーサイド）]
  ├── POST /api/auth/token   ← OBO トークン交換（クライアントシークレット保護）
  └── POST /api/agent        ← Foundry Agent API 呼び出し（ストリーミング）
          ↓
[Microsoft Azure]
  ├── Entra ID               ← 認証・OBO トークン発行
  └── Foundry Agent Service  ← エージェント実行・RBAC・Tool Approval
          ↓ OAuth identity passthrough
[CData Connect AI]
  └── リモート MCP エンドポイント  ← Per-User OAuth / 5層アクセス制御
          ↓
[Salesforce（サンドボックス）]
  └── 商談データ（ユーザーのプロファイル権限でフィルタ）
```

---

## 3. 認証フロー詳細

### 3-1. ブラウザ側（MSAL.js）

```
1. loginPopup() で Entra ID 認証
2. ID Token・Access Token（Foundry スコープ）を取得
3. acquireTokenSilent() でトークンをサイレントリフレッシュ（期限切れ前）
```

### 3-2. OBO トークン交換（API Route: /api/auth/token）

```
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
  grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
  assertion={ユーザーの Access Token}
  client_id={アプリの Client ID}
  client_secret={クライアントシークレット ※サーバーサイドのみ}
  scope=https://ai.azure.com/.default
  requested_token_use=on_behalf_of
```

クライアントシークレットはブラウザに露出させず、API Route 内でのみ使用する。

> **スコープ／エンドポイントの注意（新 Foundry）**：本デモは新 Foundry（`ai.azure.com` の New Foundry）を前提とする。
> Agent / Responses API 呼び出しのオーディエンスは **`https://ai.azure.com/.default`**（旧 Azure ML の `https://ml.azure.com/.default` ではない）。
> `FOUNDRY_PROJECT_ENDPOINT` は新 Foundry ポータルでコピーする「Project endpoint」を使用し、
> 呼び出し元ユーザーには **Foundry User** ロール（旧称 Azure AI User）が必要。SDK は `azure-ai-projects`（`AIProjectClient`）を用いる。

### 3-3. CData OAuth identity passthrough（Foundry 管理）

- Foundry の MCP 接続設定に CData Connect AI の OAuth エンドポイントを **Custom OAuth（OAuth Identity Passthrough）** として登録
  - CData は Microsoft 外のサードパーティ MCP のため、**Managed OAuth（Microsoft Entra トークン）は使用不可**（Foundry は `Cannot pass Microsoft token to untrusted MCP endpoint.` を返す）。CData Connect AI 自身の OAuth アプリ登録を使う必要がある
  - MCP ツールの `require_approval` が Tool Approval に対応（③で可視化）
- 初回：`oauth_consent_request` を API レスポンスで受信 → フロント側でコンセントリンクを表示（承認後に再送して継続）
- 以降：Foundry が CData Token を自動保管・使用（`offline_access` スコープで自動リフレッシュ）。コンセントは「ユーザー×エージェント」単位で保持される

---

## 4. API 設計

### POST `/api/auth/token`

Entra ID の OBO フローで Foundry 用 Access Token を取得する。

**リクエスト**

```typescript
{ assertion: string }   // ユーザーの Access Token
```

**レスポンス**

```typescript
{ accessToken: string; expiresIn: number }
```

### POST `/api/agent`

Foundry Agent Service を呼び出し、フロー状態・コンセント要求・エージェント応答をストリーミングで返す。

**リクエスト**

```typescript
{
  prompt: string
  userId: string
  sortMode: 'pipeline' | 'amount' | 'close'
}
```

**レスポンス（Server-Sent Events）**

```typescript
// フロー状態更新（ステップ 0〜4。表示ラベルは ①〜⑤）
{ type: 'flow_update'; step: 0|1|2|3|4; status: 'processing'|'waiting'|'done'|'error' }

// 初回コンセント要求
{ type: 'consent_required'; consentLink: string }

// テキストチャンク（タイプライター表示用）
{ type: 'text'; content: string }

// 完了（フロー全体のサマリー）
{ type: 'done'; mcpTool: string; sfFilter: string; responseMs: number }
```

---

## 5. 環境変数

| 変数名 | 用途 | 保管場所 |
|--------|------|---------|
| `AZURE_TENANT_ID` | Entra ID テナント ID | `.env.local` |
| `AZURE_CLIENT_ID` | アプリ登録の Client ID | `.env.local` |
| `AZURE_CLIENT_SECRET` | OBO フロー用クライアントシークレット | `.env.local`（本番は Key Vault） |
| `FOUNDRY_PROJECT_ENDPOINT` | 新 Foundry ポータル（ai.azure.com）でコピーする Project endpoint | `.env.local` |
| `FOUNDRY_AGENT_NAME` | 使用するエージェント名 | `.env.local` |
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | MSAL.js 用 Client ID（ブラウザ公開可） | `.env.local` |

---

## 6. デプロイ構成

| 環境 | 構成 | 用途 |
|------|------|------|
| ローカル開発 | `next dev`（localhost:3000） | 開発・動作確認 |
| リハーサル | Azure Static Web Apps または Vercel | 7/22 リハーサル用 |
| 本番（イベント当日） | 同上（安定ドメインでアクセス） | 7/24 ライブデモ |

**ネットワーク対策**：会場ネットワーク不安定を想定し、以下を考慮する。
- Foundry API タイムアウトを 30 秒に設定
- モックモード切替フラグ（`NEXT_PUBLIC_MOCK_MODE=true`）を用意し、API 障害時は静的データにフォールバック

---

## 7. パフォーマンス要件

| 項目 | 目標値 | 対策 |
|------|--------|------|
| 初回ページ表示 | 2秒以内 | Next.js の静的最適化・Noto Sans JP のサブセット化 |
| エージェント初回応答 | 10秒以内 | `stepDelay` 9500ms でフロー可視化しながらカバー |
| ユーザー切替 | 即時（<200ms） | 状態変更のみ・API 呼び出しなし |
| トークンリフレッシュ | 透過的（ユーザー操作不要） | MSAL の `acquireTokenSilent()` |

---

## 8. セキュリティ要件

| 項目 | 対策 |
|------|------|
| クライアントシークレットの保護 | API Route（サーバーサイド）のみで使用。ブラウザに露出しない |
| トークンの保管 | MSAL のデフォルト（sessionStorage）を使用。localStorage は使用しない |
| Markdown のサニタイズ | `rehype-sanitize` を使用しつつ、ステージバッジ用の `style` 属性のみ許可 |
| CORS | API Routes は同一オリジンのみ受け付ける |
| Entra アプリ登録 | 最小権限スコープのみ要求（Foundry User ロール相当） |

---

## 9. 開発ツール

| ツール | 用途 |
|--------|------|
| ESLint + Prettier | コード品質・フォーマット統一 |
| TypeScript strict mode | 型安全の徹底 |
| Vitest + React Testing Library | 単体・状態機械・コンポーネントのテスト（テストファースト） |
| Playwright | E2E 受け入れテスト・デザイン確認用スクリーンショット |
| `next/bundle-analyzer` | バンドルサイズ確認 |
| `.env.local` | ローカル環境変数（Git 管理外） |
