# API トークン検証 design（設計）

> 作業：`/api/agent` 入口の①検証＋OBO サーバー内化　作成日：2026年7月6日
> 関連：[requirements.md](./requirements.md) / [docs/token-validation-sequence.md](../../docs/token-validation-sequence.md)（シーケンス図・認可整理）

---

## 1. 変更後のフロー（要点）

```
ブラウザ(MSAL) --①(aud=api://{clientId}) Bearer--> /api/agent
  /api/agent:
    1) verifyUserToken(①)  … 署名/aud/iss/exp/scp  → NG:401/403
    2) exchangeOboToken(①) … サーバー内 OBO → ②(aud=ai.azure.com)
    3) runAgent(②)         … Foundry(Responses/MCP) → SSE
  ②はブラウザに出さない。/api/auth/token は撤去。
```

## 2. 追加/変更ファイル

| 種別 | ファイル                          | 変更                                                                                  |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 追加 | `src/lib/verifyToken.ts`          | `jose` で①検証。`TokenError(status,message)` を投げる                                 |
| 変更 | `src/lib/obo.ts`                  | `exchangeOboToken(params): Promise<OboTokenResponse>` を追加（`buildOboForm` 再利用） |
| 変更 | `src/app/api/agent/route.ts`      | 入口で①検証→OBO→runAgent。認証失敗は JSON 401/403、成功時のみ SSE                     |
| 削除 | `src/app/api/auth/token/route.ts` | ②をブラウザへ返す経路は不要                                                           |
| 変更 | `src/hooks/useAuth.ts`            | `getAccessToken` を「①（MSAL assertion）を返す」に（OBO はサーバーへ移設）            |
| 変更 | `src/hooks/useAgent.ts`           | `callAgent` は①を Bearer 送信。非 2xx（401/403 等）は `{error}` を読んでエラー表示    |

## 3. `verifyToken.ts` 設計

```ts
verifyUserToken(bearer: string): Promise<JWTPayload>
// cfg=getServerConfig() から tenantId/clientId
// jwks = createRemoteJWKSet(https://login.microsoftonline.com/{tid}/discovery/v2.0/keys)  ※モジュールキャッシュ
// jwtVerify(bearer, jwks, {
//   audience: [`api://${clientId}`, clientId],
//   issuer:   [`https://login.microsoftonline.com/${tid}/v2.0`, `https://sts.windows.net/${tid}/`],
// }) 失敗→ TokenError(401)
// scp に 'access_as_user' が無い → TokenError(403)
```

- `exp`/`nbf`/署名は `jwtVerify` が検証。`aud`/`iss` はオプションで検証。`scp` は payload から手動チェック。
- `TokenError { status:number }` を route が受けて `NextResponse.json({error}, {status})`。

## 4. `/api/agent` 設計（認証は SSE の外）

1. `getServerConfig()`（不足→500）
2. `Authorization: Bearer` 抽出。無→401
3. `verifyUserToken(①)`：TokenError→その status（401/403）
4. `body.prompt` 無→400
5. `exchangeOboToken({assertion:①,…})`：失敗→502
6. 成功時のみ `ReadableStream`（SSE）で `runAgent(②)` を配信（既存の SSE ロジックは維持）

## 5. クライアント変更

- `useAuth.getAccessToken`：`acquireAssertionToken()`（①）を返すだけ（`/api/auth/token` 呼び出しを削除）。
- `useAgent.callAgent`：`fetch('/api/agent', { headers:{Authorization:Bearer ①}})`。`if(!res.ok)` は本文 `{error}` を読み `handleRealError`（401/403/502 を UI に表示）。

## 6. 非破壊・テスト

- モック経路（`useAgent` mock）はこの経路に来ないため不変。既存 unit 72 / e2e は green 維持。
- 追加テスト：`verifyToken` はネットワーク（JWKS）依存のため単体テストは最小限（トークン無し/`scp` 判定などの純粋部分）。実検証は実トークン＋実機（401/403 の確認）で担保。
- `exchangeOboToken` は `buildOboForm`（テスト済）を使うため回帰リスク小。

## 7. 影響範囲

- 実接続経路のみ変更。UI・モック・ドメインロジックは不変。
- `@azure/ai-projects` 等の既存依存に加え **`jose`** を追加。
