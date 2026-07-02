import 'server-only'

// ============================================================
// サーバー専用設定。クライアントバンドルに絶対に含めない。
// （import 'server-only' により、クライアントからの import はビルドエラーになる）
// ============================================================

export type ServerConfig = {
  tenantId: string
  clientId: string
  clientSecret: string
  foundryProjectEndpoint: string
  foundryAgentName: string
}

export class ServerConfigError extends Error {
  constructor(missing: string[]) {
    super(`実接続に必要なサーバー環境変数が不足しています: ${missing.join(', ')}`)
    this.name = 'ServerConfigError'
  }
}

/**
 * サーバー env を検証して返す。不足時は ServerConfigError を投げる（呼び出し側で
 * graceful に error イベント化する）。
 */
export function getServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const cfg = {
    tenantId: env.AZURE_TENANT_ID,
    clientId: env.AZURE_CLIENT_ID,
    clientSecret: env.AZURE_CLIENT_SECRET,
    foundryProjectEndpoint: env.FOUNDRY_PROJECT_ENDPOINT,
    foundryAgentName: env.FOUNDRY_AGENT_NAME,
  }
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missing.length > 0) throw new ServerConfigError(missing)
  return cfg as ServerConfig
}
