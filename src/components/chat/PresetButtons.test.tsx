import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresetButtons } from './PresetButtons'

describe('PresetButtons', () => {
  it('プリセットが対応する sortMode で送信される', async () => {
    const onSend = vi.fn()
    render(<PresetButtons onSend={onSend} disabled={false} />)

    await userEvent.click(screen.getByText('今月のパイプラインを見せて'))
    expect(onSend).toHaveBeenLastCalledWith('今月のパイプラインを見せて', 'pipeline')

    await userEvent.click(screen.getByText('金額が大きい順に並べて'))
    expect(onSend).toHaveBeenLastCalledWith('金額が大きい順に並べて', 'amount')

    await userEvent.click(screen.getByText('クローズが近い商談を教えて'))
    expect(onSend).toHaveBeenLastCalledWith('クローズが近い商談を教えて', 'close')
  })

  it('busy 中は全ボタン disabled', () => {
    render(<PresetButtons onSend={vi.fn()} disabled={true} />)
    for (const b of screen.getAllByRole('button')) {
      expect(b).toBeDisabled()
    }
  })
})
