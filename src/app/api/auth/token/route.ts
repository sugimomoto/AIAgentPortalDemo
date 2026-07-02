import { NextResponse, type NextRequest } from 'next/server'
import { getServerConfig, ServerConfigError } from '@/lib/serverConfig'
import { buildOboForm, oboTokenEndpoint } from '@/lib/obo'
import type { OboTokenResponse } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Entra OBO トークン交換。client_secret はここ（サーバー）でのみ使用する。
export async function POST(req: NextRequest) {
  let cfg
  try {
    cfg = getServerConfig()
  } catch (e) {
    if (e instanceof ServerConfigError)
      return NextResponse.json({ error: e.message }, { status: 500 })
    throw e
  }

  const body = (await req.json().catch(() => null)) as { assertion?: unknown } | null
  const assertion = body?.assertion
  if (typeof assertion !== 'string' || !assertion) {
    return NextResponse.json(
      { error: 'assertion（ユーザーの Access Token）が必要です' },
      { status: 400 },
    )
  }

  const form = buildOboForm({
    tenantId: cfg.tenantId,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    assertion,
  })

  const res = await fetch(oboTokenEndpoint(cfg.tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json(
      { error: 'OBO トークン交換に失敗しました', detail },
      { status: res.status },
    )
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  const payload: OboTokenResponse = { accessToken: json.access_token, expiresIn: json.expires_in }
  return NextResponse.json(payload)
}
