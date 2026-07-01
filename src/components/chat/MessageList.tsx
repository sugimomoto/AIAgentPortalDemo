'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/lib/types'
import { MessageBubble } from './MessageBubble'

function ThinkingDots() {
  return (
    <div className="flex justify-start" data-testid="thinking">
      <div
        style={{
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: '16px 16px 16px 5px',
          padding: '16px 20px',
          display: 'flex',
          gap: 6,
        }}
      >
        {[0, 0.18, 0.36].map((d) => (
          <span
            key={d}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#94A3B8',
              animation: `bounceDot 1.2s infinite`,
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function MessageList({ messages, thinking }: { messages: Message[]; thinking: boolean }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, thinking])

  const showThinking = thinking && !messages.some((m) => m.role === 'agent' && m.streaming)

  if (messages.length === 0 && !thinking) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ padding: '22px 32px' }}
        data-testid="empty-state"
      >
        <p style={{ fontSize: 17, color: '#94A3B8', textAlign: 'center' }}>
          下のプリセットから質問を選ぶか、自由に入力してください
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto"
      style={{ padding: '22px 32px', gap: 16 }}
      data-testid="message-list"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {showThinking && <ThinkingDots />}
      <div ref={endRef} />
    </div>
  )
}
