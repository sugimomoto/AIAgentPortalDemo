import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { USERS } from '@/lib/mockData'

describe('Header', () => {
  it('現在ユーザー名と役職を表示', () => {
    render(<Header user={USERS.tanaka} onSelectUser={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText('田中 一郎')).toBeInTheDocument()
    expect(screen.getAllByText('営業担当').length).toBeGreaterThan(0)
  })

  it('切替トリガーでドロップダウンが開き、選択で onSelectUser・閉じる', async () => {
    const onSelectUser = vi.fn()
    render(<Header user={USERS.tanaka} onSelectUser={onSelectUser} onLogout={vi.fn()} />)

    // 初期はメニュー非表示
    expect(screen.queryByRole('menu')).toBeNull()

    await userEvent.click(screen.getByLabelText('ユーザー切替'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.click(screen.getByText('山田 花子'))
    expect(onSelectUser).toHaveBeenCalledWith('yamada')
    // 選択でメニューが閉じる
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('ログアウトボタンで onLogout', async () => {
    const onLogout = vi.fn()
    render(<Header user={USERS.tanaka} onSelectUser={vi.fn()} onLogout={onLogout} />)
    await userEvent.click(screen.getByLabelText('ログアウト'))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
