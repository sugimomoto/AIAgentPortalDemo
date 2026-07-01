'use client'

import { COLORS } from '@/lib/tokens'

const ITEMS = [
  { label: 'Entra Token', color: COLORS.entraToken },
  { label: 'CData Token', color: COLORS.cdataToken },
  { label: 'SF Token', color: COLORS.sfToken },
]

export function TokenLegend() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,.08)',
        padding: '13px 30px',
        display: 'flex',
        gap: 24,
        flexShrink: 0,
      }}
    >
      {ITEMS.map((it) => (
        <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ width: 15, height: 15, borderRadius: 4, background: it.color }}
            aria-hidden
          />
          <span style={{ fontSize: 15, color: '#94A3B8' }}>{it.label}</span>
        </span>
      ))}
    </footer>
  )
}
