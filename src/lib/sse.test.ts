import { describe, it, expect } from 'vitest'
import { serializeSse, parseSseLine, parseSse } from './sse'
import type { AgentEvent } from './types'

/** 文字列を任意サイズのチャンクに分割して ReadableStream 化 */
function streamFrom(text: string, chunkSize: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  let i = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= bytes.length) {
        controller.close()
        return
      }
      controller.enqueue(bytes.slice(i, i + chunkSize))
      i += chunkSize
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = []
  for await (const ev of parseSse(stream)) out.push(ev)
  return out
}

const events: AgentEvent[] = [
  { type: 'flow_update', step: 0, status: 'processing' },
  { type: 'flow_update', step: 0, status: 'done' },
  { type: 'consent_required', consentLink: 'https://consent.example/abc' },
  { type: 'text', content: 'こんにちは' },
  { type: 'done', mcpTool: 'query', sfFilter: "owner = '田中 一郎'", responseMs: 234 },
]

describe('serializeSse / parseSseLine', () => {
  it('ラウンドトリップできる', () => {
    for (const ev of events) {
      const line = serializeSse(ev).trimEnd() // "data: {...}"
      expect(parseSseLine(line)).toEqual(ev)
    }
  })

  it('空行・コメント行は null', () => {
    expect(parseSseLine('')).toBeNull()
    expect(parseSseLine(': ping')).toBeNull()
    expect(parseSseLine('data:')).toBeNull()
  })
})

describe('parseSse（ストリーム）', () => {
  it('全イベントを順に復元する（大きいチャンク）', async () => {
    const text = events.map(serializeSse).join('')
    expect(await collect(streamFrom(text, 1024))).toEqual(events)
  })

  it('イベント途中でチャンク境界が来ても復元できる（1バイトずつ）', async () => {
    const text = events.map(serializeSse).join('')
    expect(await collect(streamFrom(text, 1))).toEqual(events)
  })

  it('末尾に区切りが無くても最後のイベントを拾う', async () => {
    const text = 'data: ' + JSON.stringify(events[0]) // \n\n なし
    expect(await collect(streamFrom(text, 3))).toEqual([events[0]])
  })
})
