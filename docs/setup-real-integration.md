# 実接続セットアップ手順

> 対象：`NEXT_PUBLIC_MOCK_MODE=false` で Entra ID / Foundry / CData Connect AI に実接続する場合の準備手順。
> 背景・設計は [architecture.md](./architecture.md) §3–§5、実装は [.steering/20260702-real-integration-scaffold/](../.steering/20260702-real-integration-scaffold/) を参照。

> 注：現段階では `lib/foundry.ts` の `runAgent` 実行部が **未配線（TODO）** です。本手順で env と各サービスを整えたうえで、`runAgent` に実 SDK 呼び出しを実装してください。

---

## 0. 全体像

```
ブラウザ(MSAL) --ログイン--> Entra ID
   │ ユーザー Access Token(assertion)
   ▼
/api/auth/token --OBO--> Entra ID --> Foundry 用 Access Token（audience: ai.azure.com）
   │ Bearer
   ▼
/api/agent --> Foundry Agent Service --(Custom OAuth identity passthrough)--> CData Connect AI --> Salesforce
```

---

## 1. Entra ID アプリ登録

1. Azure Portal → **Microsoft Entra ID → アプリの登録 → 新規登録**。
2. **リダイレクト URI**（SPA）に開発 URL を追加：`http://localhost:3000`（本番ドメインも後で追加）。
3. **API のアクセス許可**：新 Foundry を呼ぶため、Azure AI 系の委任スコープ（`https://ai.azure.com/.default` 相当）を付与し、必要に応じて管理者同意。
4. **証明書とシークレット → 新しいクライアントシークレット**を作成（OBO 用。値は一度しか表示されないので控える）。
5. 取得値を env へ：
   - `AZURE_TENANT_ID` / `NEXT_PUBLIC_AZURE_TENANT_ID` … ディレクトリ（テナント）ID
   - `AZURE_CLIENT_ID` / `NEXT_PUBLIC_AZURE_CLIENT_ID` … アプリケーション（クライアント）ID
   - `AZURE_CLIENT_SECRET` … 作成したシークレット（**サーバーのみ**）

---

## 2. Foundry（新 Foundry / ai.azure.com）

1. [ai.azure.com](https://ai.azure.com) の New Foundry でプロジェクトを開く。
2. **Project endpoint** をコピー → `FOUNDRY_PROJECT_ENDPOINT`
   （例：`https://<resource>.services.ai.azure.com/api/projects/<project>`）。
3. 使用するエージェント名を `FOUNDRY_AGENT_NAME` に設定。
4. 呼び出しユーザー（デモアカウント）に **Foundry User**（旧 Azure AI User）ロールを付与。
5. Agent/Responses API のオーディエンスは **`https://ai.azure.com/.default`**（旧 `ml.azure.com` ではない）。本実装の `FOUNDRY_SCOPE`（`lib/config.ts`）と一致。

---

## 3. CData Connect AI（Custom OAuth / identity passthrough）

1. CData Connect AI 側で **OAuth アプリ**を登録し、リモート MCP エンドポイントを用意。
2. Foundry の **MCP 接続設定**に CData の OAuth エンドポイントを **Custom OAuth（OAuth Identity Passthrough）** として登録。
   - CData は Microsoft 外のサードパーティ MCP のため **Managed OAuth（Microsoft Entra トークン）は使用不可**
     （Foundry は `Cannot pass Microsoft token to untrusted MCP endpoint.` を返す）。
   - MCP ツールの `require_approval` を Tool Approval に対応させる（Inside the Agent の③で可視化）。
3. 初回実行時に `oauth_consent_request` が返る → UI がコンセントリンクを表示 → 承認後に継続。
   以降は Foundry が CData Token を保管（`offline_access` で自動リフレッシュ、ユーザー×エージェント単位）。
4. Salesforce（サンドボックス）側は CData のコネクション設定でユーザー権限に紐付け。

---

## 4. .env.local

[.env.local.example](../.env.local.example) をコピーして実値を設定し、切替：

```bash
cp .env.local.example .env.local
# 上記1〜3の値を記入し、実接続にするなら↓
# NEXT_PUBLIC_MOCK_MODE=false
```

- `NEXT_PUBLIC_AZURE_CLIENT_ID` と `NEXT_PUBLIC_AZURE_TENANT_ID` の**両方**が無いと、安全側でモックにフォールバックします（`lib/config.ts` の `isRealConfigReady`）。

---

## 5. 残りの実装（runAgent）

`src/lib/foundry.ts` の `runAgent` に、`@azure/ai-projects` の agents API を用いて以下を実装します（TODO コメント参照）：

1. `flow_update` step0–2（Entra 認証・OBO・Foundry 内部処理）
2. 初回：Foundry の `oauth_consent_request` を検知 → `consent_required`（consentLink）で停止
3. 承認後：MCP ツール実行（CData→Salesforce）→ `flow_update` step3–4
4. 応答を `text` で逐次 → 最後に `done`（mcpTool / sfFilter / responseMs）

SSE の形は `src/lib/types.ts` の `AgentEvent`、直列化は `src/lib/sse.ts` を使用（クライアントは `useAgent` が `parseSse` で消費）。

---

## 6. 動作確認

```bash
NEXT_PUBLIC_MOCK_MODE=false npm run dev
```

- ログインで MSAL のポップアップが出る → サインイン → `/api/auth/token`（OBO）→ `/api/agent`（SSE）。
- 失敗時はチャットにエラーメッセージが出ます（`fallbackToMock` を有効にするとモック回答で代替可能）。
- 会場保険として、当日は `NEXT_PUBLIC_MOCK_MODE=true` に即戻せるようにしておく。
