import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/lib/types'

describe('MessageBubble', () => {
  it('ユーザー発言はプレーンテキストで表示', () => {
    const msg: Message = { id: 'u1', role: 'user', content: 'こんにちは' }
    render(<MessageBubble message={msg} />)
    expect(screen.getByText('こんにちは')).toBeInTheDocument()
  })

  it('エージェント発言は Markdown（テーブル+ステージバッジ span）を描画', () => {
    const md = [
      '**田中 一郎** さんの権限で **8件**。',
      '',
      '| 商談名 | ステージ |',
      '|:--|:--|',
      '| A社 | <span style="background:#FEF3C7;color:#B45309">Negotiation</span> |',
    ].join('\n')
    const msg: Message = { id: 'a1', role: 'agent', content: md }
    const { container } = render(<MessageBubble message={msg} />)

    // テーブルが描画される
    expect(container.querySelector('table')).toBeTruthy()
    // ステージバッジ span が style 付きで残る
    const badge = screen.getByText('Negotiation')
    expect(badge.tagName.toLowerCase()).toBe('span')
    // jsdom は hex を rgb に正規化する（#FEF3C7 → rgb(254, 243, 199)）
    expect(badge.getAttribute('style')).toContain('rgb(254, 243, 199)')
  })

  it('streaming 中はキャレットを表示', () => {
    const msg: Message = { id: 'a2', role: 'agent', content: '生成中', streaming: true }
    render(<MessageBubble message={msg} />)
    expect(screen.getByTestId('stream-caret')).toBeInTheDocument()
  })

  it('streaming でなければキャレットなし', () => {
    const msg: Message = { id: 'a3', role: 'agent', content: '完了' }
    render(<MessageBubble message={msg} />)
    expect(screen.queryByTestId('stream-caret')).toBeNull()
  })
})
