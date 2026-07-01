'use client'

import { useCallback, useState } from 'react'
import type { FlowStatus, FlowStepIndex } from '@/lib/types'

/** シーケンスのステップ数（①〜⑤） */
export const STEP_COUNT = 5

/**
 * Inside the Agent の5ステップ状態（idle/processing/waiting/done/error）を保持する。
 * 進行のタイミング制御は useAgent が担い、本フックは状態の器に徹する。
 */
export function useAgentFlow() {
  const [flow, setFlow] = useState<FlowStatus[]>(() => Array(STEP_COUNT).fill('idle'))

  const setStatus = useCallback((step: FlowStepIndex, status: FlowStatus) => {
    setFlow((prev) => {
      const next = [...prev]
      next[step] = status
      return next
    })
  }, [])

  const reset = useCallback(() => setFlow(Array(STEP_COUNT).fill('idle')), [])

  return { flow, setStatus, reset }
}
