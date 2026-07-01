'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, SortMode, User } from '@/lib/types'
import { OPPORTUNITIES, buildAgentAnswer, filterByUser } from '@/lib/mockData'
import { TIMING } from '@/lib/tokens'
import { useAgentFlow } from './useAgentFlow'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let msgSeq = 0
const nextId = () => `m${Date.now()}-${msgSeq++}`

/** ④ CData OAuth に対応するステップ index */
const CONSENT_STEP = 3

export type UseAgentOptions = {
  /** 1ステップの表示時間（ms） */
  stepDelay?: number
  /** 初回コンセント停止の ON/OFF */
  requireConsent?: boolean
}

/**
 * エージェント呼び出しの状態機械（モック）。
 * send → ステップ0..4 を順に進め、④で（初回のみ）コンセント待ちで停止。
 * approveConsent で再開、finish で回答をタイプライター表示する。
 * runId により、再送時は古い非同期処理を無効化する。
 */
export function useAgent(user: User, options: UseAgentOptions = {}) {
  const { flow, setStatus, reset: resetFlow } = useAgentFlow()

  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [dataVisible, setDataVisible] = useState(false)
  const [awaitingConsent, setAwaitingConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('pipeline')

  // 非同期クロージャから最新値を読むための ref 群
  const runIdRef = useRef(0)
  const userRef = useRef(user)
  const sortModeRef = useRef(sortMode)
  const consentGivenRef = useRef(consentGiven)
  const stepDelayRef = useRef(options.stepDelay ?? TIMING.defaultStepDelay)
  const requireConsentRef = useRef(options.requireConsent ?? true)

  useEffect(() => {
    userRef.current = user
  }, [user])
  useEffect(() => {
    sortModeRef.current = sortMode
  }, [sortMode])
  useEffect(() => {
    consentGivenRef.current = consentGiven
  }, [consentGiven])
  useEffect(() => {
    stepDelayRef.current = options.stepDelay ?? TIMING.defaultStepDelay
  }, [options.stepDelay])
  useEffect(() => {
    requireConsentRef.current = options.requireConsent ?? true
  }, [options.requireConsent])

  /** 回答生成＋タイプライター表示 */
  const finish = useCallback(async (id: number) => {
    setDataVisible(true)
    setQuerying(false)
    setThinking(false)

    const u = userRef.current
    const opps = filterByUser(OPPORTUNITIES, u.key)
    const ans = buildAgentAnswer(u, opps, sortModeRef.current)

    const msgId = nextId()
    setMessages((prev) => [...prev, { id: msgId, role: 'agent', content: '', streaming: true }])

    // イントロをタイプライター表示（22ms/文字）
    for (let i = 1; i <= ans.intro.length; i++) {
      await delay(TIMING.typewriterPerChar)
      if (runIdRef.current !== id) return
      const partial = ans.intro.slice(0, i)
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: partial } : m)))
    }

    // 250ms 後にフィルタ＋テーブルを一括追加して確定
    await delay(TIMING.tableDelay)
    if (runIdRef.current !== id) return
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, content: ans.full, streaming: false } : m)),
    )
  }, [])

  /** startStep から順にステップを進める（④で待機停止する場合あり） */
  const runSteps = useCallback(
    async (startStep: number, id: number) => {
      for (let step = startStep; step < 5; step++) {
        if (runIdRef.current !== id) return

        // ④：初回かつ要コンセントなら待機で停止
        if (step === CONSENT_STEP && !consentGivenRef.current && requireConsentRef.current) {
          setStatus(CONSENT_STEP, 'waiting')
          setAwaitingConsent(true)
          return
        }

        setStatus(step as 0 | 1 | 2 | 3 | 4, 'processing')
        await delay(stepDelayRef.current)
        if (runIdRef.current !== id) return
        setStatus(step as 0 | 1 | 2 | 3 | 4, 'done')

        if (step < 4) {
          await delay(TIMING.stepGap)
          if (runIdRef.current !== id) return
        }
      }
      await finish(id)
    },
    [setStatus, finish],
  )

  /** プロンプト送信 */
  const send = useCallback(
    async (text: string, mode: SortMode) => {
      const id = ++runIdRef.current
      setSortMode(mode)
      sortModeRef.current = mode

      setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: text }])
      setThinking(true)
      setQuerying(true)
      setDataVisible(false)
      setAwaitingConsent(false)
      resetFlow()

      await delay(TIMING.startDelay)
      if (runIdRef.current !== id) return
      await runSteps(0, id)
    },
    [resetFlow, runSteps],
  )

  /** コンセント承認 → ④→⑤ を再開 */
  const approveConsent = useCallback(async () => {
    const id = runIdRef.current
    setConsentGiven(true)
    consentGivenRef.current = true
    setAwaitingConsent(false)

    setStatus(CONSENT_STEP, 'processing')
    await delay(stepDelayRef.current)
    if (runIdRef.current !== id) return
    setStatus(CONSENT_STEP, 'done')
    await delay(TIMING.stepGap)
    if (runIdRef.current !== id) return

    await runSteps(4, id)
  }, [setStatus, runSteps])

  /** 全状態リセット（ログアウト用） */
  const reset = useCallback(() => {
    runIdRef.current++ // 進行中の非同期を無効化
    setMessages([])
    resetFlow()
    setThinking(false)
    setQuerying(false)
    setDataVisible(false)
    setAwaitingConsent(false)
    setConsentGiven(false)
    consentGivenRef.current = false
    setSortMode('pipeline')
  }, [resetFlow])

  const busy = querying || awaitingConsent

  return {
    flow,
    messages,
    thinking,
    querying,
    dataVisible,
    awaitingConsent,
    consentGiven,
    sortMode,
    busy,
    send,
    approveConsent,
    reset,
  }
}
