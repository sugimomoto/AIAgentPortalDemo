'use client'

import type { Message } from '@/lib/types'
import { Markdown } from './Markdown'

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end" data-role="user">
        <div
          style={{
            maxWidth: '84%',
            background: '#0F1E3D',
            color: '#fff',
            padding: '14px 19px',
            borderRadius: '16px 16px 5px 16px',
            fontSize: 18,
            lineHeight: 1.55,
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start" data-role="agent">
      <div
        className="md-body"
        style={{
          maxWidth: '96%',
          background: '#F1F5F9',
          color: '#0F172A',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          borderRadius: '16px 16px 16px 5px',
          fontSize: 18,
          lineHeight: 1.7,
        }}
      >
        <Markdown>{message.content}</Markdown>
        {message.streaming && (
          <span
            data-testid="stream-caret"
            style={{
              display: 'inline-block',
              width: 2,
              height: 18,
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              background: '#0F1E3D',
              animation: 'blinkCaret .9s step-end infinite',
            }}
          />
        )}
      </div>
    </div>
  )
}
