import { FOUNDRY_SCOPE } from './config'

// ============================================================
// Entra On-Behalf-Of（OBO）トークン交換のリクエスト組立（純粋関数）
// docs/architecture.md §3-2 準拠
// ============================================================

export type OboParams = {
  tenantId: string
  clientId: string
  clientSecret: string
  /** ユーザーの Access Token（assertion） */
  assertion: string
  /** 既定は Foundry スコープ */
  scope?: string
}

/** Entra のトークンエンドポイント URL */
export function oboTokenEndpoint(tenantId: string): string {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
}

/** application/x-www-form-urlencoded 形式の body を組み立てる */
export function buildOboForm(params: OboParams): URLSearchParams {
  const form = new URLSearchParams()
  form.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  form.set('client_id', params.clientId)
  form.set('client_secret', params.clientSecret)
  form.set('assertion', params.assertion)
  form.set('scope', params.scope ?? FOUNDRY_SCOPE)
  form.set('requested_token_use', 'on_behalf_of')
  return form
}
