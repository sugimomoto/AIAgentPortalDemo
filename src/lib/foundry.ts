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

/** 承認要求（MCP/OAuth consent）らしき output item から consent リンクを探す（best-effort） */
function extractConsentLink(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null
  const rec = item as Record<string, unknown>
  const type = typeof rec.type === 'string' ? rec.type : ''
  // MCP 承認要求 / OAuth コンセント要求らしき item のみ対象
  if (!/approval|consent|oauth/i.test(type)) return null
  for (const key of ['consent_link', 'consentLink', 'url', 'authorization_url', 'link']) {
    const v = rec[key]
    if (typeof v === 'string' && v.startsWith('http')) return v
  }
  // 見つからなくても、承認要求であることは伝える
  return ''
}

/**
 * エージェントを実行し、進行状況を AgentEvent として yield する。
 *
 * 新 Foundry のホスト型エージェントは Responses API（OpenAI 互換）で実行する。
 * `getOpenAIClient({ azureConfig: { agentName, allowPreview: true } })` が
 * エージェントエンドポイント向けの OpenAI クライアントを返す。
 *
 * フロー可視化（①〜⑤）は実 API では個別に観測できないため近似でマッピングする：
 *   ①②③（Entra 認証 / OBO / Foundry 内部）… 呼び出し到達時点で done
 *   ④ CData OAuth … 呼び出し中〜MCP 実行開始まで
 *   ⑤ データアクセス … MCP/テキスト出力〜完了
 *
 * NOTE(要ライブ検証): CData Custom OAuth の初回コンセント（oauth_consent_request）が
 * Responses ストリームのどのイベント/アイテムで返るかは実機ログで要確定。
 * ここでは output_item に approval/consent/oauth らしき type があれば consent_required に
 * マッピングする best-effort 実装。consent 承認後の resume（previous_response_id +
 * mcp_approval_response）も実機確認後に精緻化する。
 */
export async function* runAgent(params: RunAgentParams): AsyncGenerator<AgentEvent> {
  const started = Date.now()
  const client = createFoundryClient(params.accessToken, params.config.foundryProjectEndpoint)
  const openai = client.getOpenAIClient({
    azureConfig: { agentName: params.config.foundryAgentName, allowPreview: true },
  })

  // ①②③：ここに到達した時点で Entra 認証・OBO・Foundry 認可は通っている
  yield { type: 'flow_update', step: 0, status: 'done' }
  yield { type: 'flow_update', step: 1, status: 'done' }
  yield { type: 'flow_update', step: 2, status: 'done' }
  // ④ CData OAuth（開始）
  yield { type: 'flow_update', step: 3, status: 'processing' }

  let step3Done = false
  const mcpTool = ''
  const toStep4 = function* (): Generator<AgentEvent> {
    if (!step3Done) {
      step3Done = true
      yield { type: 'flow_update', step: 3, status: 'done' }
      yield { type: 'flow_update', step: 4, status: 'processing' }
    }
  }

  const stream = await openai.responses.create({ input: params.prompt, stream: true })

  for await (const event of stream) {
    switch (event.type) {
      case 'response.output_item.added': {
        const link = extractConsentLink(event.item)
        if (link !== null) {
          // 初回コンセント要求：UI を待機させる
          yield { type: 'consent_required', consentLink: link }
          return
        }
        break
      }
      case 'response.mcp_call.in_progress':
      case 'response.mcp_list_tools.in_progress':
        yield* toStep4()
        break
      case 'response.output_text.delta':
        yield* toStep4()
        yield { type: 'text', content: event.delta }
        break
      case 'response.completed':
        yield* toStep4()
        yield { type: 'flow_update', step: 4, status: 'done' }
        yield {
          type: 'done',
          mcpTool,
          sfFilter: '',
          responseMs: Date.now() - started,
        }
        return
      case 'response.failed':
        yield {
          type: 'error',
          message: event.response?.error?.message ?? 'エージェント実行に失敗しました',
        }
        return
      case 'error':
        yield { type: 'error', message: event.message }
        return
      default:
        // その他のイベントは可視化しない
        break
    }
  }
}
