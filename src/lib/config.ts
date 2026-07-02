import { resolveStepDelay } from './tokens'

// ============================================================
// クライアント公開設定（NEXT_PUBLIC_*）と mock/real 切替
// ※ サーバー専用のシークレットは lib/serverConfig.ts で扱う（本ファイルには置かない）
// ============================================================

export type PublicConfig = {
  mockMode: boolean
  clientId?: string
  tenantId?: string
  stepDelayMs: number
}

/** real 接続に最低限必要な公開設定が揃っているか */
export function isRealConfigReady(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_AZURE_CLIENT_ID && env.NEXT_PUBLIC_AZURE_TENANT_ID)
}

/**
 * モードを決定する。
 * - `NEXT_PUBLIC_MOCK_MODE` が 'false' 以外（未設定含む）→ 常にモック（安全側の既定）
 * - 'false' でも real 設定が不足していればモックにフォールバック
 */
export function isMockMode(env: Record<string, string | undefined> = process.env): boolean {
  if (env.NEXT_PUBLIC_MOCK_MODE !== 'false') return true
  return !isRealConfigReady(env)
}

export function getPublicConfig(
  env: Record<string, string | undefined> = process.env,
): PublicConfig {
  return {
    mockMode: isMockMode(env),
    clientId: env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    tenantId: env.NEXT_PUBLIC_AZURE_TENANT_ID,
    stepDelayMs: resolveStepDelay(env.NEXT_PUBLIC_STEP_DELAY_MS),
  }
}

/** MSAL / OBO で要求する Foundry スコープ（新 Foundry） */
export const FOUNDRY_SCOPE = 'https://ai.azure.com/.default'
