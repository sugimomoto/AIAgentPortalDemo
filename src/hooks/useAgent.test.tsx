import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAgent } from './useAgent'
import { USERS, OPPORTUNITIES, buildAgentAnswer, filterByUser } from '@/lib/mockData'
import type { Message } from '@/lib/types'

/** fake timers を進めつつ React の state 更新を反映する */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const agentMessages = (messages: Message[]) => messages.filter((m) => m.role === 'agent')
const userMessages = (messages: Message[]) => messages.filter((m) => m.role === 'user')

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useAgent.send', () => {
  it('送信でユーザー発言追加・querying/thinking 立ち上げ・sortMode 反映', () => {
    const { result } = renderHook(() => useAgent(USERS.tanaka, { stepDelay: 10 }))
    act(() => {
      void result.current.send('金額が大きい順に並べて', 'amount')
    })
    expect(userMessages(result.current.messages)).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('金額が大きい順に並べて')
    expect(result.current.querying).toBe(true)
    expect(result.current.thinking).toBe(true)
    expect(result.current.sortMode).toBe('amount')
    expect(result.current.busy).toBe(true)
  })
})

describe('useAgent ④コンセント待機', () => {
  it('初回は step3 が waiting で停止し awaitingConsent=true', async () => {
    const { result } = renderHook(() =>
      useAgent(USERS.tanaka, { stepDelay: 10, requireConsent: true }),
    )
    act(() => {
      void result.current.send('今月のパイプラインを見せて', 'pipeline')
    })
    await advance(3000)

    expect(result.current.flow).toEqual(['done', 'done', 'done', 'waiting', 'idle'])
    expect(result.current.awaitingConsent).toBe(true)
    expect(result.current.querying).toBe(true)
    // 待機中はまだ回答が出ていない
    expect(agentMessages(result.current.messages)).toHaveLength(0)
  })
})

describe('useAgent.approveConsent', () => {
  it('承認で ④→⑤ 再開し完了、2回目は止まらない', async () => {
    const { result } = renderHook(() =>
      useAgent(USERS.tanaka, { stepDelay: 10, requireConsent: true }),
    )

    // 1回目：④で待機
    act(() => {
      void result.current.send('今月のパイプラインを見せて', 'pipeline')
    })
    await advance(3000)
    expect(result.current.awaitingConsent).toBe(true)

    // 承認 → 完了まで進める
    act(() => {
      void result.current.approveConsent()
    })
    await advance(5000)
    expect(result.current.flow).toEqual(['done', 'done', 'done', 'done', 'done'])
    expect(result.current.consentGiven).toBe(true)
    expect(result.current.awaitingConsent).toBe(false)
    expect(agentMessages(result.current.messages)).toHaveLength(1)

    // 2回目：consentGiven 保持 → ④で止まらず完走
    act(() => {
      void result.current.send('今月のパイプラインを見せて', 'pipeline')
    })
    await advance(6000)
    expect(result.current.awaitingConsent).toBe(false)
    expect(result.current.flow).toEqual(['done', 'done', 'done', 'done', 'done'])
    expect(agentMessages(result.current.messages)).toHaveLength(2)
  })
})

describe('useAgent runId キャンセル', () => {
  it('再送すると古い実行は無効化され、最後の送信だけが完了する', async () => {
    const { result } = renderHook(() =>
      useAgent(USERS.tanaka, { stepDelay: 10, requireConsent: false }),
    )

    act(() => {
      void result.current.send('first', 'pipeline')
    })
    await advance(500) // 進行中に
    act(() => {
      void result.current.send('second', 'amount')
    })
    await advance(20000)

    // ユーザー発言は2件、エージェント回答は最後の1件のみ
    expect(userMessages(result.current.messages).map((m) => m.content)).toEqual(['first', 'second'])
    expect(agentMessages(result.current.messages)).toHaveLength(1)
    expect(result.current.querying).toBe(false)
  })
})

describe('useAgent.finish タイプライター', () => {
  it('イントロを1文字ずつ→250ms後にテーブル一括追加して確定', async () => {
    const { result } = renderHook(() =>
      useAgent(USERS.tanaka, { stepDelay: 10, requireConsent: false }),
    )
    const ans = buildAgentAnswer(USERS.tanaka, filterByUser(OPPORTUNITIES, 'tanaka'), 'pipeline')

    act(() => {
      void result.current.send('今月のパイプラインを見せて', 'pipeline')
    })

    // 全ステップ完了 → finish 開始直後（数文字だけタイプ済み）
    await advance(2450 + 22 * 4)
    const mid = agentMessages(result.current.messages)[0]
    expect(mid).toBeTruthy()
    expect(mid.streaming).toBe(true)
    expect(mid.content.length).toBeGreaterThan(0)
    expect(ans.intro.startsWith(mid.content)).toBe(true)
    expect(mid.content).not.toBe(ans.full)

    // 十分に進める → イントロ完了＋テーブル確定
    await advance(ans.intro.length * 22 + 250 + 100)
    const done = agentMessages(result.current.messages)[0]
    expect(done.content).toBe(ans.full)
    expect(done.streaming).toBe(false)
    expect(result.current.dataVisible).toBe(true)
  })
})
