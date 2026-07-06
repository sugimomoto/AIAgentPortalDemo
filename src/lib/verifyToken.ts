import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { getServerConfig } from './serverConfig'

// ============================================================
// ①ユーザートークン（aud = api://{clientId}）の検証
// 署名(JWKS) / aud / iss / exp は jwtVerify、scp は手動チェック。
// 検証は in-process（1リクエストごとに Entra へ問い合わせない）。JWKS はキャッシュ。
// ============================================================

/** 要求スコープ（Expose an API で定義した委任スコープ） */
const REQUIRED_SCOPE = 'access_as_user'

export class TokenError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TokenError'
    this.status = status
  }
}

// テナントごとに JWKS をキャッシュ（未知の kid が来たら jose が自動再取得）
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()
function getJwks(tenantId: string) {
  let jwks = jwksCache.get(tenantId)
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
    )
    jwksCache.set(tenantId, jwks)
  }
  return jwks
}

/**
 * Bearer トークン（①）を検証して payload を返す。
 * 失敗時は TokenError（401：認証不正 / 403：スコープ不足）を投げる。
 */
export async function verifyUserToken(bearer: string): Promise<JWTPayload> {
  const { tenantId, clientId } = getServerConfig()

  // aud はトークン版により api://{clientId} か {clientId}(GUID) のどちらか
  const audiences = [`api://${clientId}`, clientId]
  // iss は v2（/v2.0）と v1（sts.windows.net）の両方を許容
  const issuers = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ]

  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(bearer, getJwks(tenantId), {
      audience: audiences,
      issuer: issuers,
    }))
  } catch (e) {
    throw new TokenError(401, `トークン検証に失敗しました: ${e instanceof Error ? e.message : ''}`)
  }

  // scp（委任スコープ）に access_as_user が含まれるか
  const scp = typeof payload.scp === 'string' ? payload.scp.split(' ') : []
  if (!scp.includes(REQUIRED_SCOPE)) {
    throw new TokenError(403, `スコープ不足です（${REQUIRED_SCOPE} が必要）`)
  }

  return payload
}
