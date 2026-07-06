'use client'

import { useCallback, useEffect, useState } from 'react'
import type { User, UserKey } from '@/lib/types'
import { DEFAULT_USER_KEY, USERS } from '@/lib/mockData'
import { isMockMode } from '@/lib/config'

export type Screen = 'login' | 'portal'

export type UseAuthOptions = {
  /** モック/実接続の切替（既定は isMockMode()） */
  mockMode?: boolean
}

/**
 * 認証。モードにより挙動を切り替える。
 * - mock：MSAL を使わず screen/user state のみ（チャット履歴は useAgent 側で保持）
 * - real：MSAL でサインイン、OBO 経由で Foundry アクセストークンを取得
 *   （MSAL はモックバンドルに含めないよう動的 import）
 *
 * NOTE(実接続): デモの2ユーザー・ペルソナ表示モデルは維持している。
 * 「ユーザーごとの実 Entra ログイン」への対応は後続の精緻化とする。
 */
export function useAuth(options: UseAuthOptions = {}) {
  const mockMode = options.mockMode ?? isMockMode()
  const [screen, setScreen] = useState<Screen>('login')
  const [userKey, setUserKey] = useState<UserKey>(DEFAULT_USER_KEY)
  const [error, setError] = useState<string | null>(null)

  // 実接続：起動時に MSAL を初期化し、リダイレクト/ポップアップ応答（#code）を消費。
  // 既にサインイン済みならポータルへ。
  useEffect(() => {
    if (mockMode) return
    let cancelled = false
    void (async () => {
      try {
        const { bootstrap } = await import('@/lib/msal')
        const account = await bootstrap()
        if (!cancelled && account) setScreen('portal')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '認証の初期化に失敗しました')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mockMode])

  const login = useCallback(() => {
    if (mockMode) {
      setScreen('portal')
      return
    }
    void (async () => {
      try {
        const { signIn } = await import('@/lib/msal')
        await signIn()
        setScreen('portal')
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'ログインに失敗しました')
      }
    })()
  }, [mockMode])

  const logout = useCallback(() => {
    if (!mockMode) {
      void (async () => {
        try {
          const { signOut } = await import('@/lib/msal')
          await signOut()
        } catch {
          // ログアウト失敗は致命的でないため握りつぶす
        }
      })()
    }
    setScreen('login')
    setUserKey(DEFAULT_USER_KEY)
    setError(null)
  }, [mockMode])

  const selectUser = useCallback((key: UserKey) => setUserKey(key), [])

  /**
   * 実接続用：①ユーザー Access Token（aud=api://{clientId}）を返す。
   * OBO→②の交換はサーバー（/api/agent）が内部で行うため、ここでは①をそのまま返す。
   * useAgent の getAccessToken として渡し、Bearer①で /api/agent を呼ぶ。
   */
  const getAccessToken = useCallback(async (): Promise<string> => {
    const { acquireAssertionToken } = await import('@/lib/msal')
    return acquireAssertionToken()
  }, [])

  const user: User = USERS[userKey]

  return { screen, user, userKey, mockMode, error, login, logout, selectUser, getAccessToken }
}
