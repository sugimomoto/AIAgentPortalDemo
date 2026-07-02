import { resolveStepDelay } from './tokens'

// ============================================================
// クライアント公開設定（NEXT_PUBLIC_*）と mock/real 切替
// ※ サーバー専用のシークレットは lib/serverConfig.ts で扱う（本ファイルには置かない）
//
// 重要：Next.js はクライアント側で「`process.env.NEXT_PUBLIC_X` というリテラル表記」
// のみをビルド時にインライン置換する。エイリアス変数経由（env.NEXT_PUBLIC_X）は
// クライアントで undefined になるため、既定値はこの CLIENT_ENV（リテラル参照）を使う。
// ============================================================

type PublicEnv = Record<string, string | undefined>

/** クライアントにインラインされる公開 env（リテラル参照が必須） */
const CLIENT_ENV: PublicEnv = {
  NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE,
  NEXT_PUBLIC_AZURE_CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
  NEXT_PUBLIC_AZURE_TENANT_ID: process.env.NEXT_PUBLIC_AZURE_TENANT_ID,
  NEXT_PUBLIC_STEP_DELAY_MS: process.env.NEXT_PUBLIC_STEP_DELAY_MS,
  NEXT_PUBLIC_API_SCOPE: process.env.NEXT_PUBLIC_API_SCOPE,
}

export type PublicConfig = {
  mockMode: boolean
  clientId?: string
  tenantId?: string
  stepDelayMs: number
}

/** real 接続に最低限必要な公開設定が揃っているか */
export function isRealConfigReady(env: PublicEnv = CLIENT_ENV): boolean {
  return Boolean(env.NEXT_PUBLIC_AZURE_CLIENT_ID && env.NEXT_PUBLIC_AZURE_TENANT_ID)
}

/**
 * モードを決定する。
 * - `NEXT_PUBLIC_MOCK_MODE` が 'false' 以外（未設定含む）→ 常にモック（安全側の既定）
 * - 'false' でも real 設定が不足していればモックにフォールバック
 */
export function isMockMode(env: PublicEnv = CLIENT_ENV): boolean {
  if (env.NEXT_PUBLIC_MOCK_MODE !== 'false') return true
  return !isRealConfigReady(env)
}

export function getPublicConfig(env: PublicEnv = CLIENT_ENV): PublicConfig {
  return {
    mockMode: isMockMode(env),
    clientId: env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    tenantId: env.NEXT_PUBLIC_AZURE_TENANT_ID,
    stepDelayMs: resolveStepDelay(env.NEXT_PUBLIC_STEP_DELAY_MS),
  }
}

/**
 * OBO の「下流」スコープ（＝Foundry を呼ぶトークンのオーディエンス）。
 * 新 Foundry は `https://ai.azure.com/.default`。テナント差異があれば
 * `https://cognitiveservices.azure.com/.default` に切替可能（サーバー env で上書き）。
 */
export const FOUNDRY_SCOPE = process.env.FOUNDRY_OBO_SCOPE ?? 'https://ai.azure.com/.default'

/**
 * OBO の assertion に使う「当アプリが公開する API スコープ」。
 * OBO 仕様上、assertion トークンの aud は当アプリ自身でなければならないため、
 * Foundry スコープではなく自アプリの Expose an API スコープを要求する。
 * 既定は `api://{clientId}/access_as_user`（`NEXT_PUBLIC_API_SCOPE` で上書き可）。
 */
export function apiScope(env: PublicEnv = CLIENT_ENV): string {
  if (env.NEXT_PUBLIC_API_SCOPE) return env.NEXT_PUBLIC_API_SCOPE
  const clientId = env.NEXT_PUBLIC_AZURE_CLIENT_ID
  return clientId ? `api://${clientId}/access_as_user` : ''
}
