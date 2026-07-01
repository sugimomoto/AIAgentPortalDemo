'use client'

import { LAYOUT, participantCenterX } from '@/lib/tokens'

/** 各参加者の中心 X に縦点線を描く（図全体の高さ分） */
export function Lifeline() {
  return (
    <>
      {Array.from({ length: LAYOUT.participantCount }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${participantCenterX(i)}%`,
            width: 2,
            transform: 'translateX(-1px)',
            background: 'repeating-linear-gradient(#334155 0 6px, transparent 6px 12px)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
