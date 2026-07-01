import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAgentFlow, STEP_COUNT } from './useAgentFlow'

describe('useAgentFlow', () => {
  it('初期状態は idle×5', () => {
    const { result } = renderHook(() => useAgentFlow())
    expect(result.current.flow).toEqual(Array(STEP_COUNT).fill('idle'))
  })

  it('setStatus で指定ステップだけ更新される', () => {
    const { result } = renderHook(() => useAgentFlow())
    act(() => result.current.setStatus(0, 'processing'))
    expect(result.current.flow).toEqual(['processing', 'idle', 'idle', 'idle', 'idle'])
    act(() => result.current.setStatus(0, 'done'))
    expect(result.current.flow[0]).toBe('done')
  })

  it('step0→4 を processing→done の順に遷移できる', () => {
    const { result } = renderHook(() => useAgentFlow())
    for (let s = 0 as 0 | 1 | 2 | 3 | 4; s < 5; s++) {
      act(() => result.current.setStatus(s, 'processing'))
      expect(result.current.flow[s]).toBe('processing')
      act(() => result.current.setStatus(s, 'done'))
      expect(result.current.flow[s]).toBe('done')
    }
    expect(result.current.flow).toEqual(['done', 'done', 'done', 'done', 'done'])
  })

  it('reset で全て idle に戻る', () => {
    const { result } = renderHook(() => useAgentFlow())
    act(() => result.current.setStatus(2, 'done'))
    act(() => result.current.reset())
    expect(result.current.flow).toEqual(Array(STEP_COUNT).fill('idle'))
  })
})
