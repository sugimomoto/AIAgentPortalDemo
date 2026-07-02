'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, SortMode, User } from '@/lib/types'
import { OPPORTUNITIES, buildAgentAnswer, filterByUser } from '@/lib/mockData'
import { TIMING } from '@/lib/tokens'
import { isMockMode } from '@/lib/config'
import { parseSse } from '@/lib/sse'
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
  /** モック/実接続の切替（既定は isMockMode()） */
  mockMode?: boolean
  /** 実接続用：Foundry アクセストークン取得関数（OBO 済みトークン） */
  getAccessToken?: () => Promise<string>
  /** 実接続失敗時にモック回答へフォールバックする（デモ保険） */
  fallbackToMock?: boolean
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
  const [consentLink, setConsentLink] = useState<string | null>(null)

  // 非同期クロージャから最新値を読むための ref 群
  const runIdRef = useRef(0)
  const userRef = useRef(user)
  const sortModeRef = useRef(sortMode)
  const consentGivenRef = useRef(consentGiven)
  const stepDelayRef = useRef(options.stepDelay ?? TIMING.defaultStepDelay)
  const requireConsentRef = useRef(options.requireConsent ?? true)
  const mockModeRef = useRef(options.mockMode ?? isMockMode())
  const getAccessTokenRef = useRef(options.getAccessToken)
  const fallbackRef = useRef(options.fallbackToMock ?? false)
  const lastPromptRef = useRef('')

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
  useEffect(() => {
    mockModeRef.current = options.mockMode ?? isMockMode()
  }, [options.mockMode])
  useEffect(() => {
    getAccessTokenRef.current = options.getAccessToken
  }, [options.getAccessToken])
  useEffect(() => {
    fallbackRef.current = options.fallbackToMock ?? false
  }, [options.fallbackToMock])

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

  // ========================= モック経路 =========================

  /** プロンプト送信（モック） */
  const sendMock = useCallback(
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

  /** コンセント承認 → ④→⑤ を再開（モック） */
  const approveConsentMock = useCallback(async () => {
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

  // ========================= 実接続経路 =========================

  /** 実接続失敗時のハンドリング（任意でモックへフォールバック） */
  const handleRealError = useCallback(
    async (message: string, id: number) => {
      if (runIdRef.current !== id) return
      if (fallbackRef.current) {
        await finish(id) // デモ保険：モック回答を表示
        return
      }
      setMessages((prev) => [...prev, { id: nextId(), role: 'agent', content: `⚠️ ${message}` }])
      setThinking(false)
      setQuerying(false)
      setAwaitingConsent(false)
    },
    [finish],
  )

  /** /api/agent を呼び、SSE を UI 状態にマッピングする */
  const callAgent = useCallback(
    async (consent: boolean, id: number) => {
      const getToken = getAccessTokenRef.current
      if (!getToken) return handleRealError('アクセストークン取得関数が未設定です', id)

      let token: string
      try {
        token = await getToken()
      } catch (e) {
        return handleRealError(e instanceof Error ? e.message : 'トークン取得に失敗しました', id)
      }
      if (runIdRef.current !== id) return

      let res: Response
      try {
        res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            prompt: lastPromptRef.current,
            userId: userRef.current.key,
            sortMode: sortModeRef.current,
            consent,
          }),
        })
      } catch (e) {
        return handleRealError(e instanceof Error ? e.message : 'エージェント呼び出しに失敗', id)
      }
      if (!res.ok || !res.body) return handleRealError(`エージェント応答エラー (${res.status})`, id)

      let agentMsgId: string | null = null
      for await (const ev of parseSse(res.body)) {
        if (runIdRef.current !== id) return
        switch (ev.type) {
          case 'flow_update':
            setStatus(ev.step, ev.status)
            break
          case 'consent_required':
            setConsentLink(ev.consentLink)
            setAwaitingConsent(true)
            return // approveConsent の再呼び出しを待つ
          case 'text': {
            if (!agentMsgId) {
              const mid = nextId()
              agentMsgId = mid
              setMessages((prev) => [
                ...prev,
                { id: mid, role: 'agent', content: ev.content, streaming: true },
              ])
            } else {
              const mid = agentMsgId
              setMessages((prev) =>
                prev.map((m) => (m.id === mid ? { ...m, content: m.content + ev.content } : m)),
              )
            }
            break
          }
          case 'done': {
            if (agentMsgId) {
              const mid = agentMsgId
              setMessages((prev) =>
                prev.map((m) => (m.id === mid ? { ...m, streaming: false } : m)),
              )
            }
            setDataVisible(true)
            setQuerying(false)
            setThinking(false)
            return
          }
          case 'error':
            return handleRealError(ev.message, id)
        }
      }
      // done なしでストリーム終了
      setQuerying(false)
      setThinking(false)
    },
    [setStatus, handleRealError],
  )

  /** プロンプト送信（実接続） */
  const sendReal = useCallback(
    async (text: string, mode: SortMode) => {
      const id = ++runIdRef.current
      setSortMode(mode)
      sortModeRef.current = mode
      lastPromptRef.current = text

      setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: text }])
      setThinking(true)
      setQuerying(true)
      setDataVisible(false)
      setAwaitingConsent(false)
      setConsentLink(null)
      resetFlow()

      await callAgent(consentGivenRef.current, id)
    },
    [resetFlow, callAgent],
  )

  /** コンセント承認（実接続）→ consent=true で再開 */
  const approveConsentReal = useCallback(async () => {
    const id = runIdRef.current
    setConsentGiven(true)
    consentGivenRef.current = true
    setAwaitingConsent(false)
    await callAgent(true, id)
  }, [callAgent])

  // ========================= 公開 API（mock/real 分岐）=========================

  const send = useCallback(
    (text: string, mode: SortMode) =>
      mockModeRef.current ? sendMock(text, mode) : sendReal(text, mode),
    [sendMock, sendReal],
  )

  const approveConsent = useCallback(
    () => (mockModeRef.current ? approveConsentMock() : approveConsentReal()),
    [approveConsentMock, approveConsentReal],
  )

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
    setConsentLink(null)
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
    consentLink,
    sortMode,
    busy,
    send,
    approveConsent,
    reset,
  }
}
