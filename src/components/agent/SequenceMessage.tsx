'use client'

import type { FlowStatus, SeqMessage } from '@/lib/types'
import { LAYOUT, participantCenterX } from '@/lib/tokens'
import { isActive, statusColor } from './status'
import { TokenBadge } from './TokenBadge'
import { ConsentButton } from './ConsentButton'

type Props = {
  message: SeqMessage
  status: FlowStatus
  accent: string
  consentVisible: boolean
  onApprove: () => void
}

const LABEL_STRIP = '#0F1E3D'

export function SequenceMessage({ message, status, accent, consentVisible, onApprove }: Props) {
  const color = message.consent ? '#38BDF8' : statusColor(status, accent)
  const active = isActive(status)
  const rowHeight = message.consent ? LAYOUT.seqConsentRowHeight : LAYOUT.seqRowHeight

  // ---- 自己ループ（③ Foundry）----
  if (message.selfLoop) {
    const x = participantCenterX(message.from)
    return (
      <div style={{ position: 'relative', height: rowHeight }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 22,
            left: `${x}%`,
            width: 26,
            height: 24,
            // shorthand(border) と longhand(borderLeft) の混在を避けるため辺ごとに指定
            borderTop: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
            borderBottom: `2px solid ${color}`,
            borderRadius: '0 8px 8px 0',
            animation: active ? 'seqPulse 1.1s ease-in-out infinite' : undefined,
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: 24,
            left: `calc(${x}% + 36px)`,
            fontSize: 13,
            fontWeight: 600,
            color: active ? '#F8FAFC' : '#94A3B8',
            whiteSpace: 'nowrap',
          }}
        >
          {message.label}
        </span>
      </div>
    )
  }

  // ---- 通常の矢印 ----
  const fromX = participantCenterX(message.from)
  const toX = participantCenterX(message.to)
  const leftX = Math.min(fromX, toX)
  const widthPct = Math.abs(toX - fromX)
  const pointingRight = toX > fromX
  const dashed = message.kind === 'response'

  return (
    <div style={{ position: 'relative', height: rowHeight }}>
      {/* ラベル */}
      <span
        style={{
          position: 'absolute',
          top: 5,
          left: `${leftX}%`,
          width: `${widthPct}%`,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: active ? '#F8FAFC' : status === 'idle' ? '#64748B' : '#CBD5E1',
        }}
      >
        <span style={{ background: LABEL_STRIP, padding: '0 8px' }}>{message.label}</span>
      </span>

      {/* 線 */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 38,
          left: `${leftX}%`,
          width: `${widthPct}%`,
          height: dashed ? 0 : 2,
          background: dashed ? undefined : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          animation: active ? 'seqPulse 1.1s ease-in-out infinite' : undefined,
        }}
      />

      {/* 矢じり */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 33,
          left: `${toX}%`,
          transform: pointingRight ? 'translateX(-11px)' : 'translateX(0)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: pointingRight ? `11px solid ${color}` : undefined,
          borderRight: pointingRight ? undefined : `11px solid ${color}`,
          animation: active ? 'seqPulse 1.1s ease-in-out infinite' : undefined,
        }}
      />

      {/* 注記トークン */}
      {message.note && (
        <span
          style={{
            position: 'absolute',
            top: 46,
            left: `${leftX}%`,
            width: `${widthPct}%`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <TokenBadge note={message.note} />
        </span>
      )}

      {/* コンセント承認ボタン */}
      {message.consent && (
        <span
          style={{
            position: 'absolute',
            top: 66,
            left: `${leftX}%`,
            width: `${widthPct}%`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ConsentButton visible={consentVisible} onApprove={onApprove} />
        </span>
      )}
    </div>
  )
}
