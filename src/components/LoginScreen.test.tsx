import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginScreen } from './LoginScreen'

describe('LoginScreen', () => {
  it('Microsoft ログインボタン押下で onLogin', async () => {
    const onLogin = vi.fn()
    render(<LoginScreen onLogin={onLogin} />)
    await userEvent.click(screen.getByRole('button', { name: /Microsoft アカウントでログイン/ }))
    expect(onLogin).toHaveBeenCalledTimes(1)
  })
})
