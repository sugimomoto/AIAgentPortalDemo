'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { FlowStatus, UserKey } from '@/lib/types'
import { buildSequence, PARTICIPANTS } from '@/lib/sequence'
import { LAYOUT } from '@/lib/tokens'
import { SearchIcon } from '@/components/icons'
import { ParticipantHeader } from './ParticipantHeader'
import { Lifeline } from './Lifeline'
import { SequenceSection } from './SequenceSection'
import { TokenLegend } from './TokenLegend'
import { isActive } from './status'

type Props = {
  userKey: UserKey
  flow: FlowStatus[]
  awaitingConsent: boolean
  onApprove: () => void
}

export function InsideAgentPanel({ userKey, flow, awaitingConsent, onApprove }: Props) {
  const sections = useMemo(() => buildSequence(userKey), [userKey])
  const bodyRef = useRef<HTMLDivElement>(null)

  // 進行中セクションの端点参加者をハイライト対象にする
  const activeIndices = useMemo(() => {
    const set = new Set<number>()
    for (const s of sections) {
      if (isActive(flow[s.step])) {
        for (const m of s.messages) {
          set.add(m.from)
          set.add(m.to)
        }
      }
    }
    return set
  }, [sections, flow])

  // アクティブなセクションを図の最上部へ即時スクロール
  useEffect(() => {
    const activeStep = sections.find((s) => isActive(flow[s.step]))?.step
    if (activeStep === undefined) return
    const body = bodyRef.current
    if (!body) return
    const el = body.querySelector<HTMLElement>(`[data-sec="${activeStep}"]`)
    if (el) body.scrollTop = el.offsetTop
  }, [flow, sections])

  return (
    <aside
      style={{
        width: LAYOUT.agentPanelWidth,
        background: '#0F1E3D',
        color: '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* ヘッダー */}
      <header
        style={{
          padding: '16px 30px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <SearchIcon size={26} color="#60A5FA" />
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Inside the Agent</div>
          <div style={{ fontSize: 15.5, color: '#64748B' }}>
            認証・認可フローをリアルタイムに可視化
          </div>
        </div>
      </header>

      <ParticipantHeader participants={PARTICIPANTS} activeIndices={activeIndices} />

      {/* 図本体 */}
      <div
        ref={bodyRef}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 20px 16px' }}
      >
        <div style={{ position: 'relative' }}>
          <Lifeline />
          {sections.map((s) => (
            <SequenceSection
              key={s.step}
              section={s}
              status={flow[s.step]}
              awaitingConsent={awaitingConsent}
              onApprove={onApprove}
            />
          ))}
        </div>
      </div>

      <TokenLegend />
    </aside>
  )
}
