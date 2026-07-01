import type { Participant, SeqSection, UserKey } from './types'
import { filterLabel } from './mockData'

// ============================================================
// シーケンス図の宣言的定義（design_handoff/README.md
// 「セクションとメッセージ（正しい認証・認可フロー）」準拠）
// ============================================================

/** 参加者（左→右 index 0–5） */
export const PARTICIPANTS: Participant[] = [
  { index: 0, label: '社内ユーザー', sub: 'Entra アカウント', color: '#94A3B8', icon: 'user' },
  { index: 1, label: 'Entra ID', sub: '認証・認可基盤', color: '#FBBF24', icon: 'lock' },
  { index: 2, label: 'Web App', sub: '社内ポータル', color: '#7DD3FC', icon: 'browser' },
  { index: 3, label: 'Foundry', sub: 'Agent Service', color: '#A78BFA', icon: 'sparkle' },
  { index: 4, label: 'CData', sub: 'Connect AI MCP', color: '#4ADE80', icon: 'link' },
  { index: 5, label: 'Salesforce', sub: 'データソース', color: '#22D3EE', icon: 'cloud' },
]

/**
 * ①〜⑤のセクション定義を返す。
 * ⑤の Salesforce 応答フィルタ注記のみ、ログインユーザーにより差し替える。
 */
export function buildSequence(userKey: UserKey): SeqSection[] {
  return [
    {
      step: 0,
      title: 'ユーザー認証（Entra ID）',
      accent: '#3B82F6',
      tint: 'rgba(59,130,246,.10)',
      messages: [
        { from: 0, to: 1, label: 'ログインリクエスト', kind: 'request' },
        {
          from: 1,
          to: 0,
          label: 'ID Token 発行',
          kind: 'response',
          note: { text: 'ID Token', token: 'entra' },
        },
      ],
    },
    {
      step: 1,
      title: 'Web App → Foundry（OBO トークン交換）',
      accent: '#8B5CF6',
      tint: 'rgba(139,92,246,.10)',
      messages: [
        { from: 0, to: 2, label: 'プロンプト送信', kind: 'request' },
        {
          from: 2,
          to: 1,
          label: 'OBO トークン要求',
          kind: 'request',
          note: { text: 'assertion + scope', token: 'entra' },
        },
        {
          from: 1,
          to: 2,
          label: 'Foundry 用 Access Token',
          kind: 'response',
          note: { text: 'Entra', token: 'entra' },
        },
        {
          from: 2,
          to: 3,
          label: 'Agent API 呼び出し',
          kind: 'request',
          note: { text: 'Bearer: Entra Token', token: 'entra' },
        },
      ],
    },
    {
      step: 2,
      title: 'Foundry 内部処理',
      accent: '#22C55E',
      tint: 'rgba(34,197,94,.10)',
      messages: [
        { from: 3, to: 3, label: 'RBAC チェック（Foundry User）', kind: 'request', selfLoop: true },
        { from: 3, to: 3, label: 'Tool Approval', kind: 'request', selfLoop: true },
      ],
    },
    {
      step: 3,
      title: 'OAuth identity passthrough（初回のみ）',
      accent: '#3B82F6',
      tint: 'rgba(59,130,246,.10)',
      messages: [
        { from: 3, to: 2, label: 'oauth_consent_request', kind: 'response' },
        { from: 2, to: 0, label: 'コンセントリンク表示', kind: 'response' },
        {
          from: 0,
          to: 4,
          label: 'CData OAuth でサインイン・コンセント',
          kind: 'request',
          consent: true,
        },
        {
          from: 4,
          to: 3,
          label: 'CData OAuth Token 発行・保管',
          kind: 'response',
          note: { text: 'CData', token: 'cdata' },
        },
      ],
    },
    {
      step: 4,
      title: 'データアクセス（2回目以降：自動）',
      accent: '#EC4899',
      tint: 'rgba(236,72,153,.09)',
      messages: [
        {
          from: 3,
          to: 4,
          label: 'MCP ツール呼び出し',
          kind: 'request',
          note: { text: 'Bearer: CData Token', token: 'cdata' },
        },
        {
          from: 4,
          to: 5,
          label: 'ユーザー権限でクエリ',
          kind: 'request',
          note: { text: 'SF OAuth Token', token: 'salesforce' },
        },
        {
          from: 5,
          to: 4,
          label: '権限範囲内のデータ',
          kind: 'response',
          // ★ユーザー切替で変化する注記
          note: { text: filterLabel(userKey), token: 'salesforce' },
        },
        { from: 4, to: 3, label: 'ツール結果', kind: 'response' },
        { from: 3, to: 2, label: 'Agent 応答', kind: 'response' },
        { from: 2, to: 0, label: '結果表示', kind: 'response' },
      ],
    },
  ]
}
