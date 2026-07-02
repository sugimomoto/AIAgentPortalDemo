import type { NextRequest } from 'next/server'
import { getServerConfig } from '@/lib/serverConfig'
import { runAgent } from '@/lib/foundry'
import { serializeSse } from '@/lib/sse'
import type { AgentEvent, SortMode } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Foundry Agent を呼び出し、進行状況を SSE（AgentEvent）で返す。
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    prompt?: string
    userId?: string
    sortMode?: SortMode
    consent?: boolean
  } | null

  const auth = req.headers.get('authorization') ?? ''
  const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AgentEvent) => controller.enqueue(encoder.encode(serializeSse(e)))
      try {
        if (!accessToken) {
          send({
            type: 'error',
            message: 'Foundry アクセストークンがありません（Authorization ヘッダ必須）',
          })
          return
        }
        if (!body?.prompt) {
          send({ type: 'error', message: 'prompt が必要です' })
          return
        }

        let cfg
        try {
          cfg = getServerConfig()
        } catch (e) {
          send({ type: 'error', message: e instanceof Error ? e.message : 'サーバー設定エラー' })
          return
        }

        for await (const ev of runAgent({
          accessToken,
          config: cfg,
          prompt: body.prompt,
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
