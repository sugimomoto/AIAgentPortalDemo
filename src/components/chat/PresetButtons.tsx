'use client'

import type { SortMode } from '@/lib/types'

/** プリセットプロンプト（ラベルと対応する表示ソート） */
export const PRESETS: { label: string; mode: SortMode }[] = [
  { label: '今月のパイプラインを見せて', mode: 'pipeline' },
  { label: '金額が大きい順に並べて', mode: 'amount' },
  { label: 'クローズが近い商談を教えて', mode: 'close' },
]

type Props = {
  onSend: (text: string, mode: SortMode) => void
  disabled: boolean
}

export function PresetButtons({ onSend, disabled }: Props) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {PRESETS.map((p) => (
        <button
          key={p.mode}
          type="button"
          disabled={disabled}
          onClick={() => onSend(p.label, p.mode)}
          style={{
            flex: '1 1 0',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#334155',
            fontSize: 15,
            padding: '13px 10px',
            borderRadius: 9,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.55 : 1,
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
