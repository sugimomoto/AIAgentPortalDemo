'use client'

import { useCallback, useState } from 'react'
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
   * 実接続用：ユーザー Access Token を取得し、OBO で Foundry 用トークンに交換して返す。
   * useAgent の getAccessToken として渡す。
   */
  const getAccessToken = useCallback(async (): Promise<string> => {
    const { acquireAssertionToken } = await import('@/lib/msal')
    const assertion = await acquireAssertionToken()
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertion }),
    })
    if (!res.ok) throw new Error(`OBO トークン交換に失敗しました (${res.status})`)
    const json = (await res.json()) as { accessToken: string }
    return json.accessToken
  }, [])

  const user: User = USERS[userKey]

  return { screen, user, userKey, mockMode, error, login, logout, selectUser, getAccessToken }
}
