'use client'

import { useCallback, useState } from 'react'
import type { User, UserKey } from '@/lib/types'
import { DEFAULT_USER_KEY, USERS } from '@/lib/mockData'

export type Screen = 'login' | 'portal'

/**
 * 認証（モック）。フェーズ2では MSAL を使わず、ログイン/ログアウト/ユーザー切替のみ。
 * チャット履歴は useAgent 側が保持するため、selectUser では何も破棄しない。
 */
export function useAuth() {
  const [screen, setScreen] = useState<Screen>('login')
  const [userKey, setUserKey] = useState<UserKey>(DEFAULT_USER_KEY)

  const login = useCallback(() => setScreen('portal'), [])

  const logout = useCallback(() => {
    setScreen('login')
    setUserKey(DEFAULT_USER_KEY)
  }, [])

  const selectUser = useCallback((key: UserKey) => setUserKey(key), [])

  const user: User = USERS[userKey]

  return { screen, user, userKey, login, logout, selectUser }
}
