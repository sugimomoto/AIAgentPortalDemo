import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from './MessageList'
import type { Message } from '@/lib/types'

beforeAll(() => {
  // jsdom には scrollIntoView が無いので noop を用意
  Element.prototype.scrollIntoView = () => {}
})

describe('MessageList', () => {
  it('メッセージ0件・非思考中は空状態プレースホルダ', () => {
    render(<MessageList messages={[]} thinking={false} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(
      screen.getByText('下のプリセットから質問を選ぶか、自由に入力してください'),
    ).toBeInTheDocument()
  })

  it('思考中は思考ドットを表示', () => {
    const msgs: Message[] = [{ id: 'u1', role: 'user', content: 'q' }]
    render(<MessageList messages={msgs} thinking={true} />)
    expect(screen.getByTestId('thinking')).toBeInTheDocument()
  })

  it('streaming 中のエージェント回答があれば思考ドットは出さない', () => {
    const msgs: Message[] = [
      { id: 'u1', role: 'user', content: 'q' },
      { id: 'a1', role: 'agent', content: '生成中', streaming: true },
    ]
    render(<MessageList messages={msgs} thinking={true} />)
    expect(screen.queryByTestId('thinking')).toBeNull()
  })
})
