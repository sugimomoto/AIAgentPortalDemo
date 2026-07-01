import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth（モック）', () => {
  it('初期は login 画面・田中', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.screen).toBe('login')
    expect(result.current.userKey).toBe('tanaka')
    expect(result.current.user.name).toBe('田中 一郎')
  })

  it('login で portal へ遷移', () => {
    const { result } = renderHook(() => useAuth())
    act(() => result.current.login())
    expect(result.current.screen).toBe('portal')
  })

  it('selectUser でユーザーが切り替わる', () => {
    const { result } = renderHook(() => useAuth())
    act(() => result.current.login())
    act(() => result.current.selectUser('yamada'))
    expect(result.current.userKey).toBe('yamada')
    expect(result.current.user.jobTitle).toBe('営業マネージャー')
    // 画面は portal のまま
    expect(result.current.screen).toBe('portal')
  })

  it('logout で login 画面・田中に戻る', () => {
    const { result } = renderHook(() => useAuth())
    act(() => result.current.login())
    act(() => result.current.selectUser('yamada'))
    act(() => result.current.logout())
    expect(result.current.screen).toBe('login')
    expect(result.current.userKey).toBe('tanaka')
  })
})
