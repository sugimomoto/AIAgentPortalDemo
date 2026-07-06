# API トークン検証 requirements（要求内容）

> 作業：`/api/agent`（自ホストのスクラッチ API）入口でのアクセストークン検証
> 作成日：2026年7月6日　作成者：杉本 和也（実装：Claude）
> 関連：[docs/token-validation-sequence.md](../../docs/token-validation-sequence.md) / [docs/architecture.md](../../docs/architecture.md) §3・§8

---

## 1. 背景・目的

実接続は完動したが、`/api/agent` は受け取ったトークンを**検証していない**（存在チェックのみ）。
さらに現状はブラウザに②Foundry トークンを渡す構造で、`/api/agent` の Bearer が②（`aud=ai.azure.com`）のため**自 API として検証できない**。

本作業で、**ブラウザは①ユーザートークン（`aud=api://{clientId}`）だけを保持**し、`/api/agent` が
**入口で①を検証（ユーザーゲート）→ サーバー内で OBO→②取得（ホスト証明）→ Foundry** とする。
②はブラウザに出さない（BFF）。

## 2. スコープ

### 含む

- `lib/verifyToken.ts`：`jose` で①を検証（署名/JWKS・`aud`・`iss`・`exp`・`scp=access_as_user`）。
- OBO をサーバー内へ：`obo.ts` に `exchangeOboToken` を追加し、`/api/agent` 内で①→②交換。
- `/api/agent` の入口検証：不正=401 / スコープ不足=403（SSE ではなく JSON ステータスで返す）。
- クライアント（`useAuth`/`useAgent`）を「②ではなく①を `/api/agent` に Bearer 送信」に変更。
- 不要になった `/api/auth/token`（②をブラウザへ返す経路）を撤去。

### 含まない

- モックモードの挙動変更（検証はスキップ、既存デモ非破壊）。
- ①取得方法（MSAL）の変更。デプロイ・2ユーザーRBAC 等は別作業。
- 証明書クレデンシャル/マネージド ID 化（将来の強化）。

## 3. 受け入れ条件

- [ ] `MOCK_MODE`（既定）では検証を通らず、現行デモが従来どおり動作（unit 72 / e2e green）。
- [ ] 実モードで、正当な①（`scp=access_as_user`・`aud=api://{clientId}`・署名OK・未失効）なら通過し、実データ表示まで到達。
- [ ] トークン無し/不正署名/aud 不一致/失効 → **401**、`scp` 不足 → **403**（JSON `{error}`）。
- [ ] ②Foundry トークンは**ブラウザに露出しない**（`/api/auth/token` 撤去、OBO はサーバー内）。
- [ ] クライアントシークレットは従来どおりサーバーのみ。型/lint/build green。

## 4. 制約

- 検証は in-process（`jose` の `createRemoteJWKSet` + `jwtVerify`）。JWKS はキャッシュ。
- `aud` は `api://{clientId}` と `{clientId}`（GUID）の両方を許容、`iss` は v2(`.../v2.0`)/v1(`sts.windows.net/{tid}/`) 両対応（トークン版差異の吸収）。
- 既存の純粋関数テスト（`buildOboForm` 等）は壊さない。

## 5. 永続ドキュメントへの影響

- 設計は [docs/token-validation-sequence.md](../../docs/token-validation-sequence.md) に集約済み。`architecture.md §4` に SSE とは別の 401/403 応答を軽微追記する可能性あり。
