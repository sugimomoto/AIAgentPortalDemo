import { NextResponse, type NextRequest } from 'next/server'
import { getServerConfig, ServerConfigError } from '@/lib/serverConfig'
import { verifyUserToken, TokenError } from '@/lib/verifyToken'
import { exchangeOboToken } from '@/lib/obo'
import { runAgent } from '@/lib/foundry'
import { serializeSse } from '@/lib/sse'
import type { AgentEvent, SortMode } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 入口で①ユーザートークンを検証（ユーザーゲート）→ サーバー内で OBO→②取得（ホスト証明）
// → Foundry を SSE で配信。②はブラウザに出さない。
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    prompt?: string
    userId?: string
    sortMode?: SortMode
    consent?: boolean
  } | null

  // --- サーバー設定 ---
  let cfg
  try {
    cfg = getServerConfig()
  } catch (e) {
    const msg = e instanceof ServerConfigError ? e.message : 'サーバー設定エラー'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // --- ①トークン検証（認証は SSE の外で JSON ステータス返却）---
  const auth = req.headers.get('authorization') ?? ''
  const userToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!userToken) {
    return NextResponse.json({ error: '認証トークンがありません' }, { status: 401 })
  }
  try {
    await verifyUserToken(userToken)
  } catch (e) {
    if (e instanceof TokenError)
      return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'トークン検証に失敗しました' }, { status: 401 })
  }

  if (!body?.prompt) {
    return NextResponse.json({ error: 'prompt が必要です' }, { status: 400 })
  }

  // --- OBO：①→②（Foundry 用トークン、サーバー内に留める）---
  let foundryToken: string
  try {
    const obo = await exchangeOboToken({
      tenantId: cfg.tenantId,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      assertion: userToken,
    })
    foundryToken = obo.accessToken
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'OBO 交換に失敗しました' },
      { status: 502 },
    )
  }

  // --- 成功時のみ SSE で Foundry 実行 ---
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: AgentEvent) => controller.enqueue(encoder.encode(serializeSse(ev)))
      try {
        for await (const ev of runAgent({
          accessToken: foundryToken,
          config: cfg,
          prompt: body.prompt!,
          userId: body.userId ?? '',
          sortMode: body.sortMode ?? 'pipeline',
          consent: body.consent,
        })) {
          send(ev)
        }
      } catch (e) {
        send({ type: 'error', message: e instanceof Error ? e.message : '不明なエラー' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
