'use client'

import type { SeqNote } from '@/lib/types'
import { NOTE_TOKEN_COLORS } from '@/lib/tokens'

export function TokenBadge({ note }: { note: SeqNote }) {
  const c = NOTE_TOKEN_COLORS[note.token]
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '1px 7px',
        borderRadius: 5,
        background: c.bg,
        color: c.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {note.text}
    </span>
  )
}
