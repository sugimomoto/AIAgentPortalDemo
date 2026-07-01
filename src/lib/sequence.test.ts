import { describe, it, expect } from 'vitest'
import { PARTICIPANTS, buildSequence } from './sequence'

describe('PARTICIPANTS', () => {
  it('6者が index 0–5 の順で定義されている', () => {
    expect(PARTICIPANTS).toHaveLength(6)
    expect(PARTICIPANTS.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(PARTICIPANTS.map((p) => p.label)).toEqual([
      '社内ユーザー',
      'Entra ID',
      'Web App',
      'Foundry',
      'CData',
      'Salesforce',
    ])
  })
})

describe('buildSequence', () => {
  it('①〜⑤の5セクションが step 0–4 に対応', () => {
    const seq = buildSequence('tanaka')
    expect(seq).toHaveLength(5)
    expect(seq.map((s) => s.step)).toEqual([0, 1, 2, 3, 4])
  })

  it('③は Foundry(3) の自己ループ2本', () => {
    const s3 = buildSequence('tanaka')[2]
    expect(s3.messages).toHaveLength(2)
    expect(s3.messages.every((m) => m.selfLoop && m.from === 3 && m.to === 3)).toBe(true)
  })

  it('④にコンセント行（consent:true）が1本ある', () => {
    const s4 = buildSequence('tanaka')[3]
    const consentRows = s4.messages.filter((m) => m.consent)
    expect(consentRows).toHaveLength(1)
    expect(consentRows[0].from).toBe(0)
    expect(consentRows[0].to).toBe(4)
  })

  it('⑤の Salesforce→CData 応答注記が田中では owner 固定', () => {
    const s5 = buildSequence('tanaka')[4]
    const dataMsg = s5.messages.find((m) => m.from === 5 && m.to === 4)
    expect(dataMsg?.note?.text).toBe("owner = '田中 一郎'")
  })

  it('⑤の注記が山田では全担当に差し替わる', () => {
    const s5 = buildSequence('yamada')[4]
    const dataMsg = s5.messages.find((m) => m.from === 5 && m.to === 4)
    expect(dataMsg?.note?.text).toBe('全担当（マネージャー権限）')
  })
})
