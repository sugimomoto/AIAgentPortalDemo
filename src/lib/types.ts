// ============================================================
// 共通型定義（docs/functional-design.md §5 / design_handoff/README.md 準拠）
// ============================================================

/** デモ用の2ユーザー */
export type UserKey = 'tanaka' | 'yamada'

/** シーケンス各ステップの状態 */
export type FlowStatus = 'idle' | 'processing' | 'waiting' | 'done' | 'error'

/** 商談テーブルの表示ソート（プリセットに対応） */
export type SortMode = 'pipeline' | 'amount' | 'close'

/** トークン種別（色分け・注記ピルで使用） */
export type TokenType = 'entra' | 'cdata' | 'salesforce'

/** フローステップの index（表示ラベルは ①〜⑤） */
export type FlowStepIndex = 0 | 1 | 2 | 3 | 4

/** ログインユーザー */
export type User = {
  key: UserKey
  name: string
  initial: string
  jobTitle: string
  roleColor: string
  roleBg: string
  avatarBg: string
  sfProfile: string
}

/** チャットメッセージ */
export type Message = {
  id: string
  role: 'user' | 'agent'
  content: string
  streaming?: boolean
}

/** Inside the Agent の1ステップ状態 */
export type FlowStep = {
  step: FlowStepIndex
  label: string
  status: FlowStatus
  detail?: string
  tokenType?: TokenType
}

/** 商談データ（デモ用モック。本番は Salesforce/MCP 連携に置換） */
export type Opportunity = {
  name: string
  stage: string
  amount: number
  owner: string
  /** YYYY-MM-DD */
  close: string
}

// ------------------------------------------------------------
// シーケンス図の宣言的定義（lib/sequence.ts で使用）
// ------------------------------------------------------------

/** シーケンス図の参加者アイコン種別 */
export type ParticipantIcon = 'user' | 'lock' | 'browser' | 'sparkle' | 'link' | 'cloud'

/** シーケンス図の参加者（左→右 index 0–5） */
export type Participant = {
  index: number
  label: string
  sub: string
  color: string
  icon: ParticipantIcon
}

/** 矢印の種類：実線=要求 / 破線=応答 */
export type ArrowKind = 'request' | 'response'

/** 矢印に付く注記ピル */
export type SeqNote = {
  text: string
  token: TokenType
}

/** シーケンス図の1メッセージ（矢印1本） */
export type SeqMessage = {
  /** 始点の参加者 index */
  from: number
  /** 終点の参加者 index */
  to: number
  label: string
  kind: ArrowKind
  note?: SeqNote
  /** ③のみ：自己ループ */
  selfLoop?: boolean
  /** ④のサインイン行：teal 特別色＋コンセント承認ボタン */
  consent?: boolean
}

/** シーケンス図のセクション（flow ステップ 0–4 に対応） */
export type SeqSection = {
  step: FlowStepIndex
  title: string
  accent: string
  tint: string
  messages: SeqMessage[]
}

// ------------------------------------------------------------
// 実接続（SSE / トークン）— docs/architecture.md §4 準拠
// ------------------------------------------------------------

/** /api/agent が SSE で返すイベント */
export type AgentEvent =
  | { type: 'flow_update'; step: FlowStepIndex; status: FlowStatus }
  | { type: 'consent_required'; consentLink: string }
  | { type: 'text'; content: string }
  | { type: 'done'; mcpTool: string; sfFilter: string; responseMs: number }
  | { type: 'error'; message: string }

/** Foundry 用アクセストークン */
export type TokenSet = {
  accessToken: string
  /** epoch ms */
  expiresOn?: number
}

/** /api/auth/token（OBO 交換）のレスポンス */
export type OboTokenResponse = {
  accessToken: string
  expiresIn: number
}
