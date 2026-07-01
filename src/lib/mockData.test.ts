import { describe, it, expect } from 'vitest'
import {
  OPPORTUNITIES,
  USERS,
  filterByUser,
  sortOpportunities,
  buildAgentAnswer,
  filterLabel,
} from './mockData'

describe('OPPORTUNITIES（モックデータ）', () => {
  it('16件定義されている', () => {
    expect(OPPORTUNITIES).toHaveLength(16)
  })

  it('全件が必須フィールドを持つ', () => {
    for (const o of OPPORTUNITIES) {
      expect(typeof o.name).toBe('string')
      expect(typeof o.stage).toBe('string')
      expect(typeof o.amount).toBe('number')
      expect(typeof o.owner).toBe('string')
      expect(o.close).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('filterByUser', () => {
  it('田中（tanaka）は owner が本人の 8 件', () => {
    const list = filterByUser(OPPORTUNITIES, 'tanaka')
    expect(list).toHaveLength(8)
    expect(list.every((o) => o.owner === '田中 一郎')).toBe(true)
  })

  it('田中の合計は ¥79,000,000', () => {
    const total = filterByUser(OPPORTUNITIES, 'tanaka').reduce((s, o) => s + o.amount, 0)
    expect(total).toBe(79_000_000)
  })

  it('山田（yamada, マネージャー）は全 16 件', () => {
    expect(filterByUser(OPPORTUNITIES, 'yamada')).toHaveLength(16)
  })

  it('元配列を破壊しない', () => {
    const before = [...OPPORTUNITIES]
    filterByUser(OPPORTUNITIES, 'tanaka')
    expect(OPPORTUNITIES).toEqual(before)
  })
})

describe('sortOpportunities', () => {
  const tanaka = filterByUser(OPPORTUNITIES, 'tanaka')

  it('pipeline は定義順（フィルタ結果の順序を保持）', () => {
    expect(sortOpportunities(tanaka, 'pipeline').map((o) => o.name)).toEqual(
      tanaka.map((o) => o.name),
    )
  })

  it('amount は金額降順', () => {
    const sorted = sortOpportunities(tanaka, 'amount')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].amount).toBeGreaterThanOrEqual(sorted[i].amount)
    }
  })

  it('close はクローズ日昇順', () => {
    const sorted = sortOpportunities(tanaka, 'close')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].close <= sorted[i].close).toBe(true)
    }
  })

  it('元配列を破壊しない', () => {
    const before = [...tanaka]
    sortOpportunities(tanaka, 'amount')
    expect(tanaka).toEqual(before)
  })
})

describe('filterLabel', () => {
  it('田中は owner 固定式', () => {
    expect(filterLabel('tanaka')).toBe("owner = '田中 一郎'")
  })
  it('山田は全担当', () => {
    expect(filterLabel('yamada')).toBe('全担当（マネージャー権限）')
  })
})

describe('buildAgentAnswer', () => {
  const tanaka = USERS.tanaka
  const yamada = USERS.yamada

  it('田中：イントロに件数8・合計¥79,000,000', () => {
    const ans = buildAgentAnswer(tanaka, filterByUser(OPPORTUNITIES, 'tanaka'), 'pipeline')
    expect(ans.count).toBe(8)
    expect(ans.total).toBe(79_000_000)
    expect(ans.intro).toContain('**8件**')
    expect(ans.intro).toContain('¥79,000,000')
    expect(ans.intro).toContain('田中 一郎')
  })

  it('田中：フィルタ表記が owner 固定', () => {
    const ans = buildAgentAnswer(tanaka, filterByUser(OPPORTUNITIES, 'tanaka'), 'pipeline')
    expect(ans.filter).toBe("owner = '田中 一郎'")
    expect(ans.body).toContain("`owner = '田中 一郎'`")
  })

  it('田中：テーブルは 8 行（ヘッダ+区切り除く）', () => {
    const ans = buildAgentAnswer(tanaka, filterByUser(OPPORTUNITIES, 'tanaka'), 'pipeline')
    const rows = ans.body.split('\n').filter((l) => l.trim().startsWith('|'))
    // ヘッダ行 + 区切り行 + データ8行 = 10
    expect(rows).toHaveLength(10)
  })

  it('ステージセルは色付きバッジ span を含む', () => {
    const ans = buildAgentAnswer(tanaka, filterByUser(OPPORTUNITIES, 'tanaka'), 'pipeline')
    expect(ans.body).toContain('<span')
    expect(ans.body).toContain('Negotiation')
    expect(ans.body).toMatch(/background:#FEF3C7/) // Negotiation 背景色
  })

  it('山田：件数16・合計¥194,900,000・全担当フィルタ', () => {
    const ans = buildAgentAnswer(yamada, filterByUser(OPPORTUNITIES, 'yamada'), 'pipeline')
    expect(ans.count).toBe(16)
    expect(ans.total).toBe(194_900_000)
    expect(ans.filter).toBe('全担当（マネージャー権限）')
    const rows = ans.body.split('\n').filter((l) => l.trim().startsWith('|'))
    expect(rows).toHaveLength(18) // ヘッダ+区切り+16
  })

  it('amount モードで金額降順に並ぶ（先頭が最大）', () => {
    const ans = buildAgentAnswer(yamada, filterByUser(OPPORTUNITIES, 'yamada'), 'amount')
    const firstDataRow = ans.body
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .slice(2)[0]
    expect(firstDataRow).toContain('富士エンジ MES導入') // 22,000,000 が最大
  })
})
