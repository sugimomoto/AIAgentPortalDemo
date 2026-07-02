'use client'

import { PublicClientApplication, type AccountInfo, type Configuration } from '@azure/msal-browser'
import { FOUNDRY_SCOPE, getPublicConfig } from './config'

// ============================================================
// MSAL（ブラウザ）— Entra ID 認証・OBO 用 assertion トークン取得
// トークン保管は MSAL 既定（sessionStorage）。localStorage は使用しない。
// ============================================================

let instance: PublicClientApplication | null = null
let initialized = false

function buildConfig(): Configuration {
  const { clientId, tenantId } = getPublicConfig()
  return {
    auth: {
      clientId: clientId ?? '',
      authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
      redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
    cache: {
      // セキュリティ要件：localStorage は使わない
      cacheLocation: 'sessionStorage',
    },
  }
}

/** シングルトン取得（SSR では生成しない） */
export function getMsalInstance(): PublicClientApplication {
  if (typeof window === 'undefined') {
    throw new Error('MSAL はブラウザでのみ利用できます')
  }
  if (!instance) instance = new PublicClientApplication(buildConfig())
  return instance
}

async function ensureInitialized(msal: PublicClientApplication): Promise<void> {
  if (!initialized) {
    await msal.initialize()
    initialized = true
  }
}

/** ログイン（ポップアップ）。成功すると AccountInfo を返す */
export async function signIn(): Promise<AccountInfo> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  const result = await msal.loginPopup({ scopes: [FOUNDRY_SCOPE] })
  msal.setActiveAccount(result.account)
  return result.account
}

export function getActiveAccount(): AccountInfo | null {
  if (typeof window === 'undefined') return null
  return getMsalInstance().getActiveAccount()
}

export async function signOut(): Promise<void> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  await msal.logoutPopup()
}

/**
 * OBO 交換の assertion に使うユーザー Access Token を取得する。
 * silent を試み、失敗時はポップアップにフォールバック。
 */
export async function acquireAssertionToken(): Promise<string> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0]
  if (!account) throw new Error('サインインが必要です')

  try {
    const res = await msal.acquireTokenSilent({ account, scopes: [FOUNDRY_SCOPE] })
    return res.accessToken
  } catch {
    const res = await msal.acquireTokenPopup({ scopes: [FOUNDRY_SCOPE] })
    return res.accessToken
  }
}
