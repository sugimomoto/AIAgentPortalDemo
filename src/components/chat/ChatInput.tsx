'use client'

import { useState } from 'react'
import type { SortMode } from '@/lib/types'
import { SendIcon } from '@/components/icons'

type Props = {
  onSend: (text: string, mode: SortMode) => void
  disabled: boolean
}

/** 入力欄からの送信は常に pipeline ソート */
export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text, 'pipeline')
    setValue('')
  }

  return (
    <form
      style={{ display: 'flex', gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        type="text"
        aria-label="質問を入力"
        placeholder="Salesforce の商談について質問する…"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          height: 54,
          border: `1px solid ${focused ? '#2563EB' : '#CBD5E1'}`,
          borderRadius: 11,
          padding: '0 18px',
          fontSize: 18,
          outline: 'none',
          background: disabled ? '#F8FAFC' : '#fff',
        }}
      />
      <button
        type="submit"
        aria-label="送信"
        disabled={disabled}
        style={{
          width: 54,
          height: 54,
          background: '#0F1E3D',
          borderRadius: 11,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          border: 'none',
        }}
      >
        <SendIcon size={22} color="#fff" />
      </button>
    </form>
  )
}
