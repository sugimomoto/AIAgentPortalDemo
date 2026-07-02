import type { AgentEvent } from './types'

// ============================================================
// Server-Sent Events（SSE）の直列化 / パース
// サーバー: AgentEvent → `data: {json}\n\n`
// クライアント: バイトストリーム → AgentEvent の非同期イテレータ
// ============================================================

/** 1 イベントを SSE の 1 メッセージ文字列にする */
export function serializeSse(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/** 1 行（`data: ...`）を AgentEvent に復元する。空行/コメントは null */
export function parseSseLine(line: string): AgentEvent | null {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed.startsWith(':')) return null
  if (!trimmed.startsWith('data:')) return null
  const json = trimmed.slice('data:'.length).trim()
  if (!json) return null
  return JSON.parse(json) as AgentEvent
}

/**
 * バイトストリームを SSE としてパースし、AgentEvent を順に yield する。
 * チャンク境界がイベント途中でも、`\n\n` 区切りでバッファリングして復元する。
 */
export async function* parseSse(stream: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        for (const line of chunk.split('\n')) {
          const ev = parseSseLine(line)
          if (ev) yield ev
        }
      }
    }
    // 末尾に区切りなしで残ったデータも処理
    const rest = buffer.trim()
    if (rest) {
      for (const line of rest.split('\n')) {
        const ev = parseSseLine(line)
        if (ev) yield ev
      }
    }
  } finally {
    reader.releaseLock()
  }
}
