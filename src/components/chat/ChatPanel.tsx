'use client'

import type { Message, SortMode } from '@/lib/types'
import { MessageList } from './MessageList'
import { PresetButtons } from './PresetButtons'
import { ChatInput } from './ChatInput'

type Props = {
  messages: Message[]
  thinking: boolean
  busy: boolean
  onSend: (text: string, mode: SortMode) => void
}

export function ChatPanel({ messages, thinking, busy, onSend }: Props) {
  return (
    <section
      className="flex flex-1 flex-col"
      style={{ background: '#fff', borderRight: '1px solid #E2E8F0' }}
    >
      <header style={{ padding: '22px 32px', borderBottom: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: 23, fontWeight: 700, color: '#0F172A' }}>エージェントに質問する</h2>
        <p style={{ fontSize: 15, color: '#94A3B8', marginTop: 2 }}>
          Salesforce の商談データを自然言語で照会
        </p>
      </header>

      <MessageList messages={messages} thinking={thinking} />

      <footer style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px 18px' }}>
        <div style={{ marginBottom: 12 }}>
          <PresetButtons onSend={onSend} disabled={busy} />
        </div>
        <ChatInput onSend={onSend} disabled={busy} />
      </footer>
    </section>
  )
}
