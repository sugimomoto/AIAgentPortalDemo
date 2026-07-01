import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentButton } from './ConsentButton'

describe('ConsentButton', () => {
  it('visible=false では描画されない', () => {
    const { container } = render(<ConsentButton visible={false} onApprove={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('visible=true で表示され、押下で onApprove', async () => {
    const onApprove = vi.fn()
    render(<ConsentButton visible={true} onApprove={onApprove} />)
    const btn = screen.getByRole('button', { name: /CData OAuth を承認/ })
    await userEvent.click(btn)
    expect(onApprove).toHaveBeenCalledTimes(1)
  })
})
