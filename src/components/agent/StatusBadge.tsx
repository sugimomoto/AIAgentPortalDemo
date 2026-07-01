'use client'

import type { FlowStatus } from '@/lib/types'

/** セクション見出しの状態バッジ（23×23 円） */
export function StatusBadge({ status, accent }: { status: FlowStatus; accent: string }) {
  const common: React.CSSProperties = {
    width: 23,
    height: 23,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  }

  if (status === 'done') {
    return (
      <span style={{ ...common, background: '#22C55E', color: '#04120A' }} aria-label="完了">
        ✓
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span
        style={{
          ...common,
          border: `2px solid rgba(255,255,255,.2)`,
          borderTopColor: accent,
          animation: 'spin .8s linear infinite',
        }}
        aria-label="処理中"
      />
    )
  }
  if (status === 'waiting') {
    return (
      <span
        style={{
          ...common,
          background: '#FBBF24',
          color: '#3A2A00',
          animation: 'pulseDot 1.1s ease-in-out infinite',
        }}
        aria-label="待機中"
      >
        ⏳
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span style={{ ...common, background: '#EF4444', color: '#fff' }} aria-label="エラー">
        ✕
      </span>
    )
  }
  // idle
  return (
    <span
      style={{ ...common, border: '2px solid rgba(255,255,255,.14)', color: '#475569' }}
      aria-label="未実行"
    />
  )
}
