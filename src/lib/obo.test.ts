import { describe, it, expect } from 'vitest'
import { buildOboForm, oboTokenEndpoint } from './obo'

const base = {
  tenantId: 'tid',
  clientId: 'cid',
  clientSecret: 'secret',
  assertion: 'user-access-token',
}

describe('oboTokenEndpoint', () => {
  it('テナントの token エンドポイントを返す', () => {
    expect(oboTokenEndpoint('tid')).toBe('https://login.microsoftonline.com/tid/oauth2/v2.0/token')
  })
})

describe('buildOboForm', () => {
  it('OBO の必須パラメータを含む', () => {
    const f = buildOboForm(base)
    expect(f.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(f.get('client_id')).toBe('cid')
    expect(f.get('client_secret')).toBe('secret')
    expect(f.get('assertion')).toBe('user-access-token')
    expect(f.get('requested_token_use')).toBe('on_behalf_of')
  })

  it('既定スコープは Foundry（ai.azure.com）', () => {
    expect(buildOboForm(base).get('scope')).toBe('https://ai.azure.com/.default')
  })

  it('scope を上書きできる', () => {
    expect(buildOboForm({ ...base, scope: 'x/.default' }).get('scope')).toBe('x/.default')
  })
})
