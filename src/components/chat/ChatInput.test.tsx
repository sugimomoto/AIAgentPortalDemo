import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  it('入力してsubmitで pipeline ソートで送信・入力欄クリア', async () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByLabelText('質問を入力')
    await userEvent.type(input, '取引先を教えて')
    await userEvent.click(screen.getByLabelText('送信'))
    expect(onSend).toHaveBeenCalledWith('取引先を教えて', 'pipeline')
    expect(input).toHaveValue('')
  })

  it('空欄では送信しない', async () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    await userEvent.click(screen.getByLabelText('送信'))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('busy 中は入力・送信が disabled', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />)
    expect(screen.getByLabelText('質問を入力')).toBeDisabled()
    expect(screen.getByLabelText('送信')).toBeDisabled()
  })
})
