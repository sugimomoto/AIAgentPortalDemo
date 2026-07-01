import type { Opportunity, SortMode, User, UserKey } from './types'
import { STAGE_BADGE } from './tokens'

// ============================================================
// デモ用ユーザー定義（design_handoff/README.md「ユーザー定義」）
// ============================================================
export const USERS: Record<UserKey, User> = {
  tanaka: {
    key: 'tanaka',
    name: '田中 一郎',
    initial: '田',
    jobTitle: '営業担当',
    roleColor: '#2563EB',
    roleBg: '#DBEAFE',
    avatarBg: '#2563EB',
    sfProfile: 'Sales User',
  },
  yamada: {
    key: 'yamada',
    name: '山田 花子',
    initial: '山',
    jobTitle: '営業マネージャー',
    roleColor: '#7C3AED',
    roleBg: '#EDE9FE',
    avatarBg: '#7C3AED',
    sfProfile: 'Sales Manager',
  },
}

/** 初期選択ユーザー */
export const DEFAULT_USER_KEY: UserKey = 'tanaka'

/** ドロップダウン表示順 */
export const USER_LIST: User[] = [USERS.tanaka, USERS.yamada]

// ============================================================
// 商談データ（16件）
// NOTE: デモ用静的データ。本番実装では Salesforce MCP 経由のデータに置換する。
// ============================================================
export const OPPORTUNITIES: Opportunity[] = [
  {
    name: 'アクロス 基幹システム更改',
    stage: 'Negotiation',
    amount: 12_000_000,
    owner: '田中 一郎',
    close: '2026-07-15',
  },
  {
    name: 'グローバルテック クラウド移行',
    stage: 'Proposal',
    amount: 8_500_000,
    owner: '田中 一郎',
    close: '2026-07-28',
  },
  {
    name: '日本ロジ WMS導入',
    stage: 'Prospecting',
    amount: 5_200_000,
    owner: '田中 一郎',
    close: '2026-08-10',
  },
  {
    name: 'さくら製造 IoT基盤構築',
    stage: 'Negotiation',
    amount: 18_700_000,
    owner: '田中 一郎',
    close: '2026-07-20',
  },
  {
    name: 'みらい銀行 データ分析基盤',
    stage: 'Qualification',
    amount: 9_300_000,
    owner: '田中 一郎',
    close: '2026-08-05',
  },
  {
    name: '東西商事 ERP刷新',
    stage: 'Closed Won',
    amount: 15_400_000,
    owner: '田中 一郎',
    close: '2026-06-30',
  },
  {
    name: 'ネクストフーズ POS連携',
    stage: 'Prospecting',
    amount: 3_800_000,
    owner: '田中 一郎',
    close: '2026-08-22',
  },
  {
    name: 'スカイ観光 予約システム',
    stage: 'Proposal',
    amount: 6_100_000,
    owner: '田中 一郎',
    close: '2026-07-31',
  },
  {
    name: '富士エンジ MES導入',
    stage: 'Negotiation',
    amount: 22_000_000,
    owner: '佐藤 健',
    close: '2026-07-18',
  },
  {
    name: '大和HD 統合基盤',
    stage: 'Proposal',
    amount: 14_500_000,
    owner: '佐藤 健',
    close: '2026-08-02',
  },
  {
    name: 'オリオン製薬 品質管理SaaS',
    stage: 'Closed Won',
    amount: 7_700_000,
    owner: '鈴木 美咲',
    close: '2026-06-28',
  },
  {
    name: 'ブライトリテール EC基盤',
    stage: 'Qualification',
    amount: 11_200_000,
    owner: '鈴木 美咲',
    close: '2026-08-12',
  },
  {
    name: '常盤エナジー 需要予測AI',
    stage: 'Prospecting',
    amount: 9_900_000,
    owner: '佐藤 健',
    close: '2026-08-25',
  },
  {
    name: 'かえで生命 契約管理',
    stage: 'Negotiation',
    amount: 16_800_000,
    owner: '鈴木 美咲',
    close: '2026-07-22',
  },
  {
    name: 'ゼニス自動車 部品調達',
    stage: 'Proposal',
    amount: 13_300_000,
    owner: '佐藤 健',
    close: '2026-08-08',
  },
  {
    name: 'つばさ航空 運航管理',
    stage: 'Closed Won',
    amount: 20_500_000,
    owner: '鈴木 美咲',
    close: '2026-07-05',
  },
]

// ============================================================
// 純粋関数
// ============================================================

/**
 * ログインユーザーの権限でフィルタする。
 * yamada（マネージャー）は全件、tanaka（担当）は自分が owner の商談のみ。
 */
export function filterByUser(list: Opportunity[], userKey: UserKey): Opportunity[] {
  if (userKey === 'yamada') return [...list]
  return list.filter((o) => o.owner === USERS.tanaka.name)
}

/** 表示ソート。pipeline=定義順 / amount=金額降順 / close=クローズ日昇順 */
export function sortOpportunities(list: Opportunity[], mode: SortMode): Opportunity[] {
  const copy = [...list]
  switch (mode) {
    case 'amount':
      return copy.sort((a, b) => b.amount - a.amount)
    case 'close':
      return copy.sort((a, b) => (a.close < b.close ? -1 : a.close > b.close ? 1 : 0))
    case 'pipeline':
    default:
      return copy
  }
}

/** 適用フィルタの表示ラベル（シーケンス⑤注記と共通） */
export function filterLabel(userKey: UserKey): string {
  return userKey === 'yamada' ? '全担当（マネージャー権限）' : "owner = '田中 一郎'"
}

// ------------------------------------------------------------
// エージェント回答（Markdown）生成
// ------------------------------------------------------------

export type AgentAnswer = {
  /** イントロ文（件数・合計）。タイプライター表示対象 */
  intro: string
  /** フィルタ表記＋テーブル＋締め文。一括追加対象 */
  body: string
  /** イントロ＋本文をつなげた最終 Markdown */
  full: string
  count: number
  total: number
  filter: string
}

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`

/** close(YYYY-MM-DD) を M/D 表記へ */
function formatClose(close: string): string {
  const [, m, d] = close.split('-')
  return `${Number(m)}/${Number(d)}`
}

/** ステージ名を色付きバッジ span（インライン HTML）へ */
function stageBadge(stage: string): string {
  const c = STAGE_BADGE[stage] ?? { bg: '#F1F5F9', fg: '#475569' }
  return `<span style="background:${c.bg};color:${c.fg};padding:2px 9px;border-radius:6px;font-size:13px;font-weight:700">${stage}</span>`
}

/**
 * エージェント回答を生成する。
 * @param user ログインユーザー
 * @param opps フィルタ済みの商談リスト（filterByUser の結果）
 * @param mode 表示ソート
 */
export function buildAgentAnswer(user: User, opps: Opportunity[], mode: SortMode): AgentAnswer {
  const sorted = sortOpportunities(opps, mode)
  const count = sorted.length
  const total = sorted.reduce((s, o) => s + o.amount, 0)
  const filter = filterLabel(user.key)

  const scope = user.key === 'yamada' ? 'チーム全体の商談' : '担当商談'
  const intro = `**${user.name}** さんの権限で、${scope}を **${count}件** 取得しました。合計 **${yen(total)}**。`

  const header = '| 商談名 | ステージ | 金額 | 担当者 | クローズ |'
  const divider = '|:--|:--|--:|:--|:--|'
  const rows = sorted.map(
    (o) =>
      `| ${o.name} | ${stageBadge(o.stage)} | ${yen(o.amount)} | ${o.owner} | ${formatClose(o.close)} |`,
  )
  const table = [header, divider, ...rows].join('\n')

  const closing =
    user.key === 'yamada'
      ? 'マネージャー権限のため、チーム全員の商談が表示されています。'
      : 'あなたが所有する商談のみが表示されています。'

  const body = `**適用フィルタ:** \`${filter}\`\n\n${table}\n\n${closing}`
  const full = `${intro}\n\n${body}`

  return { intro, body, full, count, total, filter }
}
