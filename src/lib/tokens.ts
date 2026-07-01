// ============================================================
// デザイントークン（design_handoff/README.md「Design Tokens」準拠）
// 精密な色・寸法値はここに集約する（docs/development-guidelines.md §3）
// ============================================================

export const COLORS = {
  // ベース
  headerBg: '#0F1E3D', // メイン（ヘッダー/右パネル/濃色）
  pageBg: '#F1F5F9',
  pageBgAlt: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // テキスト
  textMain: '#0F172A',
  textSub: '#475569',
  textFaint: '#64748B',
  textPlaceholder: '#94A3B8',

  // トークン種別（凡例）
  entraToken: '#F59E0B',
  entraAccent: '#FBBF24', // 濃色上のアクセント
  cdataToken: '#16A34A',
  cdataAccent: '#4ADE80',
  sfToken: '#EC4899',
  sfAccent: '#F9A8D4',

  // フロー状態
  statusDone: '#22C55E',
  statusDoneAccent: '#4ADE80',
  statusProcessing: '#3B82F6',
  statusProcessingAccent: '#60A5FA',
  statusWaiting: '#FBBF24',
  statusError: '#EF4444',

  // その他
  teal: '#38BDF8', // CData サインイン矢印・コンセント
  accentBlue: '#2563EB',
  logoGradFrom: '#2563EB',
  logoGradTo: '#152C55',
} as const

/** Microsoft ロゴ4色（2×2 グリッド） */
export const MS_LOGO = {
  topLeft: '#F25022',
  topRight: '#7FBA00',
  bottomLeft: '#00A4EF',
  bottomRight: '#FFB900',
} as const

/** レイアウト寸法（1920×1080 固定） */
export const LAYOUT = {
  headerHeight: 78,
  agentPanelWidth: 880,
  seqRowHeight: 64,
  seqConsentRowHeight: 128,
  participantCount: 6,
} as const

/** 参加者中心 X（(i+0.5)/6×100%） */
export function participantCenterX(index: number): number {
  return ((index + 0.5) / LAYOUT.participantCount) * 100
}

/** ステージ別バッジ色（背景 / 文字） */
export const STAGE_BADGE: Record<string, { bg: string; fg: string }> = {
  Prospecting: { bg: '#F1F5F9', fg: '#475569' },
  Qualification: { bg: '#DBEAFE', fg: '#1D4ED8' },
  Proposal: { bg: '#E0E7FF', fg: '#4338CA' },
  Negotiation: { bg: '#FEF3C7', fg: '#B45309' },
  'Closed Won': { bg: '#DCFCE7', fg: '#15803D' },
  'Closed Lost': { bg: '#FEE2E2', fg: '#B91C1C' },
}

/** 注記ピルのトークン別色（濃色パネル上） */
export const NOTE_TOKEN_COLORS: Record<string, { bg: string; fg: string }> = {
  entra: { bg: 'rgba(245,158,11,.16)', fg: '#FBBF24' },
  cdata: { bg: 'rgba(22,163,74,.22)', fg: '#4ADE80' },
  salesforce: { bg: 'rgba(236,72,153,.22)', fg: '#F9A8D4' },
}

/** アニメーション既定値 */
export const TIMING = {
  /** 1ステップの表示時間（ms）。既定 9500・範囲 1000–15000 */
  defaultStepDelay: 9500,
  minStepDelay: 1000,
  maxStepDelay: 15000,
  /** ステップ間の done 保持 */
  stepGap: 500,
  /** send 開始からステップ0開始までの待機 */
  startDelay: 400,
  /** タイプライター（ms/文字） */
  typewriterPerChar: 22,
  /** イントロ確定→テーブル一括追加までの間 */
  tableDelay: 250,
  /** 演出用の固定応答時間 */
  fakeResponseMs: 234,
} as const

/** 環境変数から stepDelay を読む（範囲外はクランプ） */
export function resolveStepDelay(raw?: string): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return TIMING.defaultStepDelay
  return Math.min(TIMING.maxStepDelay, Math.max(TIMING.minStepDelay, n))
}
