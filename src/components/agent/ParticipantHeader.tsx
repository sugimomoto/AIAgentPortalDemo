'use client'

import type { Participant } from '@/lib/types'
import { ParticipantGlyph } from '@/components/icons'

type Props = {
  participants: Participant[]
  activeIndices: Set<number>
}

export function ParticipantHeader({ participants, activeIndices }: Props) {
  return (
    <div style={{ display: 'flex', padding: '12px 20px 6px' }}>
      {participants.map((p) => {
        const active = activeIndices.has(p.index)
        return (
          <div
            key={p.index}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,.14)'}`,
                background: active ? `${p.color}22` : 'rgba(255,255,255,.035)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ParticipantGlyph icon={p.icon} size={24} color={active ? p.color : '#94A3B8'} />
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: active ? '#F8FAFC' : '#94A3B8',
                textAlign: 'center',
              }}
            >
              {p.label}
            </span>
            <span style={{ fontSize: 10.5, color: '#475569', textAlign: 'center' }}>{p.sub}</span>
          </div>
        )
      })}
    </div>
  )
}
