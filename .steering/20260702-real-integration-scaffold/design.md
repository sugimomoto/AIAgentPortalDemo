# 実接続 足場づくり design（設計）

> 作業：実接続スキャフォールド　作成日：2026年7月2日　作成者：杉本 和也（実装：Claude）
> 関連：[requirements.md](./requirements.md) / [docs/architecture.md](../../docs/architecture.md) §3–§5

---

## 1. 実装アプローチ

- **非破壊・増分**：既存のモック経路（`lib/mockData.ts`・`lib/sequence.ts`・UI・モック hooks）は変更しない。real は「増分の分岐」として追加する。
- **単一フックに分岐を内包**：`useAgent` を2フックに割らず（Rules of Hooks 回避）、`send`/`approveConsent` の内部で mock/real を分岐する。state と返り値インターフェースは共通。
- **純粋ロジックを切り出してテスト**：env 解決・OBO リクエスト組立・SSE の直列化/パースを純粋関数化し、ネットワーク非依存で単体テストする。real 経路（MSAL/Foundry 実 I/O）は**ビルド・型・構造**の担保に留める（クレデンシャル未整備のため）。
- **graceful degradation**：real モードでも設定不足・接続失敗時はエラーを表示し、必要ならモックにフォールバックする。

---

## 2. 切替機構（`lib/config.ts`）

```ts
export const isMockMode = (): boolean
// NEXT_PUBLIC_MOCK_MODE !== 'false' は常にモック（既定安全）。
// 'false' かつ必要な公開 env（NEXT_PUBLIC_AZURE_CLIENT_ID / TENANT）が揃う場合のみ real。
export const publicConfig: { clientId?: string; tenantId?: string; mockMode: boolean; stepDelayMs: number }
export const isRealConfigReady(): boolean // real に必要な公開設定が揃っているか
```

- サーバー専用設定（`AZURE_CLIENT_SECRET`・`FOUNDRY_PROJECT_ENDPOINT`・`FOUNDRY_AGENT_NAME`）は `lib/serverConfig.ts`（`import 'server-only'`）で読む。クライアントへ絶対に露出させない。
- real 要求だが設定不足 → `isMockMode()` は true を返す（＝安全側にフォールバック）＋ 開発時 warning。

---

## 3. データ構造 / 型（`lib/types.ts` 追加）

SSE イベント（architecture §4 準拠）：

```ts
export type AgentEvent =
  | { type: 'flow_update'; step: FlowStepIndex; status: FlowStatus }
  | { type: 'consent_required'; consentLink: string }
  | { type: 'text'; content: string }
  | { type: 'done'; mcpTool: string; sfFilter: string; responseMs: number }
  | { type: 'error'; message: string }

export type TokenSet = { accessToken: string; expiresOn?: number } // Foundry 用
export type OboTokenResponse = { accessToken: string; expiresIn: number }
```

---

## 4. API Routes

### `POST /api/auth/token`（OBO トークン交換）

- 入力：`{ assertion: string }`（ユーザーの Access Token）
- 純粋関数 `buildOboForm(assertion, { tenantId, clientId, clientSecret })` で `application/x-www-form-urlencoded` body を組み立て（テスト対象）。
- `fetch('https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token', ...)` で交換 → `{ accessToken, expiresIn }` を返す。
- `client_secret` はサーバー env のみ。失敗時は 4xx/5xx＋`{ error }`。

### `POST /api/agent`（Foundry 呼び出し → SSE）

- 入力：`{ prompt, userId, sortMode, consent?: boolean }`
- `ReadableStream` で `text/event-stream` を返す。イベントは §3 の `AgentEvent`。
- 実処理は `lib/foundry.ts` の非同期ジェネレータ `runAgent(...)` に委譲し、各 `AgentEvent` を `serializeSse(event)` で書き出す。
- サーバー設定不足・例外時は `{ type:'error', message }` を1本流して終了（クライアントは graceful 表示）。
- CORS：同一オリジンのみ（Next の既定）。

### SSE ユーティリティ（`lib/sse.ts`）

```ts
export function serializeSse(event: AgentEvent): string          // `data: {json}\n\n`
export async function* parseSse(stream: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent>
```

- `serializeSse` と、行バッファリングして JSON を復元する `parseSse` を純粋に実装（`parseSse` は `ReadableStream` をモックしてテスト）。

---

## 5. lib クライアント

### `lib/msal.ts`（ブラウザ）

- `getMsalInstance()`：`PublicClientApplication` のシングルトン（`typeof window !== 'undefined'` ガード、SSR では生成しない）。設定は `publicConfig` から。
- `signIn()`：`loginPopup(scopes)` → `AccountInfo`。
- `acquireAssertionToken(account)`：`acquireTokenSilent`（失敗時 `acquireTokenPopup`）で OBO 用 Access Token を取得。
- トークン保管は MSAL 既定（`sessionStorage`）。localStorage 不可。

### `lib/foundry.ts`（サーバー）

- `createFoundryClient(accessToken)`：`AIProjectClient`（`azure-ai-projects`）を、OBO で得た Foundry 用 Access Token を包む `TokenCredential` で初期化。endpoint は `FOUNDRY_PROJECT_ENDPOINT`。
- `async function* runAgent({ prompt, userId, sortMode, consent })`：エージェント実行の各段階を `AgentEvent` として yield（flow_update ①〜⑤・初回 consent_required・text・done）。実 SDK のストリーム対応は TODO コメントで明示（クレデンシャル整備後に確定）。

---

## 6. hooks の real 経路

### `useAgent`

- options に `mockMode?: boolean`（既定は `isMockMode()`）と `getAccessToken?: () => Promise<string>` を追加。
- `send(text, mode)`：
  - **mock**：現行ロジック（変更なし）。
  - **real**：`sendReal()` へ。`getAccessToken()` → `/api/agent` に POST（stream）→ `parseSse` で受信 → `flow_update`=`setStatus`、`consent_required`=`awaitingConsent`＋`consentLink` 保持、`text`=タイプライター追記、`done`=確定、`error`=エラーメッセージ表示（＋任意フォールバック）。
- `approveConsent()`：
  - **mock**：現行。
  - **real**：`consent:true` で `/api/agent` を再度呼び、④以降を継続。
- `runId` によるキャンセルは real 経路でも共有（再送で古い stream 読取を無効化）。

### `useAuth`

- `mockMode` 既定で挙動を選択。
  - **mock**：現行（screen/user/login/logout/selectUser）。
  - **real**：`login()`＝`signIn()`（MSAL）成功で `screen='portal'`。`getAccessToken()` を公開し、`useAgent` に渡す。
- デモの2ユーザー・ペルソナ表示モデルは維持。**real の「ユーザーごとの実 Entra ログイン」対応は後続の精緻化**とし、本作業では IF と足場のみ（コメントで明示）。

### ページ結線（`app/page.tsx`）

- `isMockMode()` を見て、real の場合のみ `useAuth` の `getAccessToken` を `useAgent` に渡す。mock の場合は現状どおり。

---

## 7. エラー / フォールバック方針

- real 要求でも公開設定が不足 → `isMockMode()`=true でモック動作（安全側）。
- `/api/agent` が `error` を返す／stream 例外 → チャットにエラーメッセージを表示し、`querying`/`awaitingConsent` を解除。ハングさせない。
- 明示フォールバック（任意）：real 失敗時に同じ入力でモック回答を出す `fallbackToMock` オプション（既定 off、デモ保険用に用意）。

---

## 8. テスト戦略

| 対象                                     | 種別       | 方針                                                        |
| ---------------------------------------- | ---------- | ----------------------------------------------------------- |
| `config`（isMockMode/isRealConfigReady） | Vitest     | env の各組合せで期待値                                      |
| `buildOboForm`                           | Vitest     | 必須パラメータ・grant_type・scope を検証                    |
| `serializeSse` / `parseSse`              | Vitest     | ラウンドトリップ・分割チャンク・複数イベント                |
| `useAgent`（mock 経路）                  | 既存テスト | **回帰なし**を維持（変更しない）                            |
| real I/O（MSAL/Foundry 実呼び出し）      | 対象外     | クレデンシャル未整備。ビルド・型・構造で担保。TODO コメント |
| 既存 E2E（MOCK_MODE）                    | Playwright | 引き続き green                                              |

- テストファースト：純粋ロジックは 🔴→🟢 で追加。

---

## 9. 影響範囲・非破壊の担保

- 既存モック経路・UI・既存テスト（55＋8）は不変。real は新規ファイル＋既存フックへの**追加分岐**のみ。
- 追加依存：`@azure/msal-browser`・`azure-ai-projects`・`@azure/core-auth`（型）。
- 永続ドキュメント：原則変更なし。SSE イベント形が確定したら `architecture.md §4` に軽微追記。
