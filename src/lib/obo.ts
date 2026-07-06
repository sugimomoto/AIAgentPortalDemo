import { FOUNDRY_SCOPE } from './config'
import type { OboTokenResponse } from './types'

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

/**
 * OBO 交換を実行し、下流（既定 Foundry）用アクセストークンを取得する。
 * client_secret を使うためサーバーサイド専用。失敗時は例外を投げる。
 */
export async function exchangeOboToken(params: OboParams): Promise<OboTokenResponse> {
  const res = await fetch(oboTokenEndpoint(params.tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildOboForm(params),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OBO トークン交換に失敗しました (${res.status}) ${detail}`)
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  return { accessToken: json.access_token, expiresIn: json.expires_in }
}
