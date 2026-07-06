# API トークン検証 tasklist

> 作業：`/api/agent` 入口の①検証＋OBO サーバー内化　作成日：2026年7月6日
> 関連：[requirements.md](./requirements.md) / [design.md](./design.md)
> 大原則：モック経路・既存テスト（unit 72 / e2e）を壊さない。

---

- [x] T1　`jose` 依存を追加
- [x] T2　`lib/verifyToken.ts`：`verifyUserToken`（JWKS 署名・`aud`・`iss`・`exp`・`scp`）＋`TokenError`
- [x] T3　`lib/obo.ts`：`exchangeOboToken(params)` 追加（`buildOboForm` 再利用・失敗時 throw）
- [x] T4　`app/api/agent/route.ts`：入口で①検証→OBO→runAgent。認証失敗は JSON 401/403、成功時 SSE
- [x] T5　`app/api/auth/token/route.ts` 撤去
- [x] T6　`hooks/useAuth.ts`：`getAccessToken` を①返却に変更（`/api/auth/token` 呼び出し削除）
- [x] T7　`hooks/useAgent.ts`：`callAgent` を①Bearer 送信・非2xx の `{error}` 表示に変更
- [x] T8　型/lint/build、unit（既存 72）green
- [x] T9　実機確認：トークン無し→401 / aud 不一致→401 / 不正→401（curl 確認済み）。正当①→実データはブラウザ検証（次）

---

## 完了条件（DoD）

- モック既定でデモが回帰なく動作（unit 72 / e2e green）。
- 実モードで①検証が効く（401/403）＋正当時に実データ表示、②はブラウザ非露出。
- クライアントシークレットはサーバーのみ・型/lint/build green。
