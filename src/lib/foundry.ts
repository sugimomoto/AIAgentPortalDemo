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

  // デバッグ：FOUNDRY_DEBUG=true でストリームイベントをサーバーログに出す
  const debug = process.env.FOUNDRY_DEBUG === 'true'
  const dlog = (...a: unknown[]) => {
    if (debug) console.log('[foundry]', ...a)
  }

  // Foundry の MCP は 1ターン内の「2回目のツール呼び出し」で 500 になる不具合があるため、
  // ツール呼び出しを 1 回に制限する（既定 1・FOUNDRY_MAX_TOOL_CALLS で調整可、0/空で無制限）。
  const maxToolCalls = Number(process.env.FOUNDRY_MAX_TOOL_CALLS ?? '1')
  const limitTools = Number.isFinite(maxToolCalls) && maxToolCalls > 0

  try {
    const stream = await openai.responses.create({
      input: params.prompt,
      stream: true,
      ...(limitTools ? { max_tool_calls: maxToolCalls } : {}),
    })

    for await (const event of stream) {
      dlog('event', event.type)
      switch (event.type) {
        case 'response.output_item.added': {
          const link = extractConsentLink(event.item)
          if (link !== null) {
            dlog('consent item', JSON.stringify(event.item))
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
        case 'response.mcp_call.failed':
        case 'response.mcp_list_tools.failed':
          console.error('[foundry] MCP 失敗イベント:', JSON.stringify(event))
          yield { type: 'error', message: `MCP ツール呼び出しに失敗しました（${event.type}）` }
          return
        case 'response.output_text.delta':
          yield* toStep4()
          yield { type: 'text', content: event.delta }
          break
        case 'response.completed':
          yield* toStep4()
          yield { type: 'flow_update', step: 4, status: 'done' }
          yield { type: 'done', mcpTool, sfFilter: '', responseMs: Date.now() - started }
          return
        case 'response.failed':
          console.error('[foundry] response.failed:', JSON.stringify(event.response?.error))
          yield {
            type: 'error',
            message: event.response?.error?.message ?? 'エージェント実行に失敗しました',
          }
          return
        case 'error':
          console.error('[foundry] error イベント:', JSON.stringify(event))
          yield { type: 'error', message: event.message }
          return
        default:
          break
      }
    }
  } catch (e) {
    // OpenAI SDK が投げた例外（Foundry 500 等）の全容をサーバーログに出す
    const err = e as { status?: number; message?: string; error?: unknown; requestID?: string }
    console.error('[foundry] stream 例外:', {
      status: err.status,
      message: err.message,
      requestID: err.requestID,
      error: err.error,
    })
    yield {
      type: 'error',
      message: err.message ?? 'エージェント実行中に例外が発生しました',
    }
  }
}
