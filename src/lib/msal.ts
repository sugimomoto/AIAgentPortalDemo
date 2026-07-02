'use client'

import { PublicClientApplication, type AccountInfo, type Configuration } from '@azure/msal-browser'
import { apiScope, getPublicConfig } from './config'

/**
 * ログイン/OBO assertion に要求するスコープ。
 * OBO 仕様上、assertion の aud は当アプリ自身である必要があるため、
 * 当アプリが公開する API スコープ（access_as_user）を要求する。
 */
function assertionScopes(): string[] {
  const s = apiScope()
  return s ? [s] : ['openid', 'profile']
}

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

/**
 * 起動時ブートストラップ。メイン窓・ポップアップ窓の両方で実行する。
 * - initialize 後に handleRedirectPromise でリダイレクト/ポップアップ応答（#code）を消費
 * - 既存アカウントがあれば active に設定して返す
 * ポップアップ窓側では handleRedirectPromise が応答を opener に中継する。
 */
export async function bootstrap(): Promise<AccountInfo | null> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  try {
    const result = await msal.handleRedirectPromise()
    if (result?.account) {
      msal.setActiveAccount(result.account)
      return result.account
    }
  } catch {
    // ポップアップ由来で残ったハッシュ等でキャッシュ不一致になることがある。
    // 無視して既存アカウント確認にフォールバックし、残存ハッシュを掃除する。
    if (typeof window !== 'undefined' && /(?:code|error|state)=/.test(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }
  const existing = msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null
  if (existing) msal.setActiveAccount(existing)
  return existing
}

/**
 * ログイン（リダイレクト）。ページ全体が Entra へ遷移し、戻り時に bootstrap の
 * handleRedirectPromise が応答を処理する。ポップアップ監視の不安定さを避けるため
 * リダイレクト方式を採用。
 */
export async function signIn(): Promise<void> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  await msal.loginRedirect({ scopes: assertionScopes() })
}

export function getActiveAccount(): AccountInfo | null {
  if (typeof window === 'undefined') return null
  return getMsalInstance().getActiveAccount()
}

export async function signOut(): Promise<void> {
  const msal = getMsalInstance()
  await ensureInitialized(msal)
  await msal.logoutRedirect()
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

  // ログイン時に同スコープを同意済みのため silent で取得できる想定。
  // 失敗時は再ログインを促す（送信処理を中断させないため redirect/popup はしない）。
  const res = await msal.acquireTokenSilent({ account, scopes: assertionScopes() })
  return res.accessToken
}
