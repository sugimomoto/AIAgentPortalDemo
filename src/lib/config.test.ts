import { describe, it, expect } from 'vitest'
import { isMockMode, isRealConfigReady, getPublicConfig } from './config'

const realEnv = {
  NEXT_PUBLIC_MOCK_MODE: 'false',
  NEXT_PUBLIC_AZURE_CLIENT_ID: 'cid',
  NEXT_PUBLIC_AZURE_TENANT_ID: 'tid',
}

describe('isMockMode', () => {
  it('未設定なら常にモック（安全側の既定）', () => {
    expect(isMockMode({})).toBe(true)
  })

  it("'true' 明示でもモック", () => {
    expect(isMockMode({ NEXT_PUBLIC_MOCK_MODE: 'true' })).toBe(true)
  })

  it("'false' かつ real 設定が揃えば real（=非モック）", () => {
    expect(isMockMode(realEnv)).toBe(false)
  })

  it("'false' でも real 設定が不足すればモックにフォールバック", () => {
    expect(isMockMode({ NEXT_PUBLIC_MOCK_MODE: 'false' })).toBe(true)
    expect(isMockMode({ NEXT_PUBLIC_MOCK_MODE: 'false', NEXT_PUBLIC_AZURE_CLIENT_ID: 'cid' })).toBe(
      true,
    )
  })
})

describe('isRealConfigReady', () => {
  it('client_id と tenant_id が揃えば true', () => {
    expect(isRealConfigReady(realEnv)).toBe(true)
  })
  it('どちらか欠ければ false', () => {
    expect(isRealConfigReady({ NEXT_PUBLIC_AZURE_CLIENT_ID: 'cid' })).toBe(false)
    expect(isRealConfigReady({})).toBe(false)
  })
})

describe('getPublicConfig', () => {
  it('stepDelay は範囲内にクランプされる', () => {
    expect(getPublicConfig({ NEXT_PUBLIC_STEP_DELAY_MS: '999999' }).stepDelayMs).toBe(15000)
    expect(getPublicConfig({ NEXT_PUBLIC_STEP_DELAY_MS: '5' }).stepDelayMs).toBe(1000)
    expect(getPublicConfig({}).stepDelayMs).toBe(9500)
  })

  it('mockMode を反映する', () => {
    expect(getPublicConfig(realEnv).mockMode).toBe(false)
    expect(getPublicConfig({}).mockMode).toBe(true)
  })
})
