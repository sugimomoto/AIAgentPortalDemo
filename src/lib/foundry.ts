import 'server-only'
import { AIProjectClient } from '@azure/ai-projects'
import type { AccessToken, TokenCredential } from '@azure/core-auth'
import type { AgentEvent, SortMode } from './types'
import type { ServerConfig } from './serverConfig'

// ============================================================
// Foundry Agent Service クライアント（サーバー専用）
// ============================================================

/** OBO で取得済みの Foundry 用アクセストークンを包む TokenCredential */
function staticCredential(accessToken: string, expiresOn?: number): TokenCredential {
  return {
    getToken: async (): Promise<AccessToken> => ({
      token: accessToken,
      expiresOnTimestamp: expiresOn ?? Date.now() + 55 * 60 * 1000,
    }),
  }
}

/** AIProjectClient を生成（新 Foundry の Project endpoint / audience=ai.azure.com） */
export function createFoundryClient(accessToken: string, endpoint: string): AIProjectClient {
  return new AIProjectClient(endpoint, staticCredential(accessToken))
}

export type RunAgentParams = {
  accessToken: string
  config: ServerConfig
  prompt: string
  userId: string
  sortMode: SortMode
  /** 2回目以降（コンセント済み）の再開呼び出しか */
  consent?: boolean
}

/**
 * エージェントを実行し、進行状況を AgentEvent として yield する。
 *
 * TODO(実接続): クレデンシャル整備後、以下を @azure/ai-projects の
 * agents API（`client.agents` / `client.getOpenAIClient({ azureConfig })`）で実装する。
 *   1. flow_update step0..2（Entra 認証・OBO・Foundry 内部処理）
 *   2. 初回は Foundry の oauth_consent_request を検知 → consent_required(consentLink)
 *   3. consent 済みで MCP ツール実行（CData→Salesforce）→ flow_update step3..4
 *   4. 応答を text で逐次 → 最後に done(mcpTool/sfFilter/responseMs)
 *
 * 現段階（scaffold）では実 SDK 呼び出しは未配線。クライアントの生成のみ行い、
 * 未配線であることを error イベントで返す（UI は graceful に表示）。
 */
export async function* runAgent(params: RunAgentParams): AsyncGenerator<AgentEvent> {
  // クライアント生成（endpoint/credential の配線確認）。実行は今後 client 経由で行う。
  const client = createFoundryClient(params.accessToken, params.config.foundryProjectEndpoint)
  void client

  yield {
    type: 'error',
    message:
      '実接続（Foundry Agent 実行）は未配線です。クレデンシャル整備後に lib/foundry.ts の runAgent を実装してください。',
  }
}
