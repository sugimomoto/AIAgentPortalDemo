'use client'

import type { FlowStatus, SeqSection } from '@/lib/types'
import { SequenceMessage } from './SequenceMessage'
import { StatusBadge } from './StatusBadge'

const STEP_LABELS = ['①', '②', '③', '④', '⑤']

type Props = {
  section: SeqSection
  status: FlowStatus
  awaitingConsent: boolean
  onApprove: () => void
}

export function SequenceSection({ section, status, awaitingConsent, onApprove }: Props) {
  return (
    <div data-sec={section.step} style={{ marginBottom: 6 }}>
      {/* ヘッダーバー */}
      <div
        style={{
          background: section.tint,
          borderLeft: `3px solid ${section.accent}`,
          padding: '7px 14px',
          borderRadius: '0 8px 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        }}
      >
        <StatusBadge status={status} accent={section.accent} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>
          {STEP_LABELS[section.step]} {section.title}
        </span>
      </div>

      {/* メッセージ群 */}
      {section.messages.map((m, i) => (
        <SequenceMessage
          key={i}
          message={m}
          status={status}
          accent={section.accent}
          consentVisible={!!m.consent && awaitingConsent}
          onApprove={onApprove}
        />
      ))}
    </div>
  )
}
