# 開発ガイドライン

> バージョン：1.0　作成日：2026年7月1日　作成者：杉本 和也

---

## 1. コーディング規約

### 基本方針

- TypeScript の `strict` モードを有効にし、`any` は原則使用しない
- コンポーネントは関数コンポーネント（FC）のみ。クラスコンポーネントは使用しない
- `'use client'` / `'use server'` を明示し、サーバー・クライアントの境界を意識する
- 副作用（API 呼び出し・タイマー）はカスタムフックに隔離し、コンポーネントをピュアに保つ

### TypeScript

```typescript
// ✅ 明示的な型定義
const step: FlowStep = { step: 1, status: 'done' }

// ❌ any の使用
const step: any = { ... }

// ✅ 型ガードを使う
function isConsentRequired(event: AgentEvent): event is ConsentEvent {
  return event.type === 'consent_required'
}

// ✅ 非 null アサーションより optional chaining
const name = user?.name ?? '不明'
```

### React / Next.js

```typescript
// ✅ Props の型を明示
type ChatPanelProps = {
  messages: Message[]
  onSend: (text: string, mode: SortMode) => void
  busy: boolean
}

// ✅ useCallback でメモ化（再レンダリングの多いコンポーネント）
const handleSend = useCallback(
  (text: string) => {
    // ...
  },
  [deps],
)

// ✅ Server Component はデフォルト。必要な箇所のみ 'use client'
// app/portal/page.tsx → Server Component
// components/chat/ChatInput.tsx → 'use client'（イベントハンドラあり）
```

---

## 2. 命名規則

| 対象                        | 規則                            | 例                              |
| --------------------------- | ------------------------------- | ------------------------------- |
| コンポーネント              | PascalCase                      | `InsideAgentPanel.tsx`          |
| フック                      | camelCase・`use` プレフィックス | `useAgentFlow.ts`               |
| 関数・変数                  | camelCase                       | `approveConsent()`, `flowSteps` |
| 定数                        | UPPER_SNAKE_CASE                | `STEP_DELAY_MS`, `MAX_RETRIES`  |
| 型・インターフェース        | PascalCase                      | `FlowStep`, `AgentEvent`        |
| CSS クラス（Tailwind 以外） | kebab-case                      | `.md-body`, `.blink-caret`      |
| 環境変数                    | UPPER_SNAKE_CASE                | `AZURE_CLIENT_SECRET`           |
| API Route                   | Next.js 規約に従う              | `app/api/agent/route.ts`        |

---

## 3. スタイリング規約

### 優先順位

1. **Tailwind CSS クラス**：余白・フレックス・テキストサイズなど汎用プロパティ
2. **インラインスタイル**：デザイントークンの精密な値（`#0F1E3D`、`880px` 固定幅など）
3. **`globals.css`**：Markdown レンダリング用の `.md-body` スタイルなど、CSS クラスが必要な場合のみ

```tsx
// ✅ Tailwind + インラインスタイルの併用
<div
  className="flex items-center gap-3 px-8"
  style={{ background: '#0F1E3D', height: '78px' }}
>

// ❌ マジックナンバーを Tailwind の任意値で埋め込む（メンテが困難）
<div className="bg-[#0F1E3D] h-[78px]">
```

### デザイントークンの扱い

精密な色・サイズ値は `src/lib/tokens.ts` に定数として定義する。

```typescript
// src/lib/tokens.ts
export const COLORS = {
  headerBg: '#0F1E3D',
  entraToken: '#F59E0B',
  cdataToken: '#16A34A',
  sfToken: '#EC4899',
} as const

export const LAYOUT = {
  headerHeight: 78,
  agentPanelWidth: 880,
} as const
```

---

## 4. 状態管理規約

### 状態の配置

| 状態の種類                          | 配置場所                                |
| ----------------------------------- | --------------------------------------- |
| グローバル（認証・ユーザー選択）    | `app/portal/page.tsx` から props で渡す |
| フロー状態（5ステップ）             | `useAgentFlow` フック                   |
| チャットメッセージ                  | `useAgent` フック                       |
| UI ローカル状態（メニュー開閉など） | 各コンポーネント内 `useState`           |

### 非同期処理のキャンセル

ユーザーが操作中に別の送信を行った場合の競合を防ぐため、`runId` パターンを使用する。

```typescript
const runIdRef = useRef(0)

const send = useCallback(async (text: string) => {
  const id = ++runIdRef.current
  // 各非同期ステップで id チェック
  if (runIdRef.current !== id) return // 古い実行はスキップ
}, [])
```

---

## 5. テスト規約

本プロジェクトは**テストファースト（TDD）を基本**とし、実機/目視確認を併用する。
ロジックは「🔴 失敗するテストを書く → 🟢 最小実装で green → ♻️ リファクタ」の順で進める。

### テストレイヤと使用ツール

| レイヤ           | ツール                         | 対象                                                                      |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------- |
| 単体（純粋関数） | Vitest                         | フィルタ・ソート・回答生成などのロジック                                  |
| 状態機械         | Vitest（fake timers）          | フロー進行（`send`/`approveConsent`/`finish`）・④待機・`runId` キャンセル |
| コンポーネント   | Vitest + React Testing Library | busy 中の disabled・ドロップダウン開閉・空状態など**挙動**                |
| E2E（受け入れ）  | Playwright                     | 受け入れ条件シナリオ（田中8件→山田16件・④コンセント停止・履歴保持）       |

- タイミング依存のロジックは **fake timers** で制御し、`stepDelay` を小さくして高速に検証する。
- **デザインのピクセル忠実性は自動テスト対象外**とし、`design_handoff` との目視＋ Playwright スクリーンショットで確認する（下記チェックリスト）。

### 動作確認チェックリスト（デモ前必須）

- [ ] ログイン → ポータル画面遷移が正常に動作する
- [ ] プリセット「今月のパイプラインを見せて」で田中の商談8件が返る
- [ ] Inside the Agent パネルが①〜⑤の順に進行する
- [ ] ④ CData OAuth が初回のみ `⏳` で止まり、コンセントボタンが表示される
- [ ] コンセント承認後、④→⑤が再開し完了する
- [ ] 山田に切替 → 同じプロンプトを送信 → 16件が返る（フィルタなし）
- [ ] `NEXT_PUBLIC_MOCK_MODE=true` でモックデータが表示される（ネットワーク障害時用）

---

## 6. Git 規約

### ブランチ戦略

```
main          ← 本番（デモ当日）
└── dev       ← 開発ベース
    └── feature/xxx  ← 機能ブランチ
```

### コミットメッセージ

```
<type>: <概要（日本語可）>

type:
  feat     - 新機能
  fix      - バグ修正
  style    - スタイル調整（機能変更なし）
  refactor - リファクタリング
  docs     - ドキュメント
  chore    - 設定・依存関係

例:
  feat: Inside the Agent パネルにコンセントボタンを追加
  fix: ユーザー切替後にフロー状態がリセットされない問題を修正
  style: ヘッダーの役職バッジの色をデザイントークンに合わせる
```

### `.gitignore` に含めるもの

```
.env.local
.env.*.local
node_modules/
.next/
```

---

## 7. デモ固有の開発ルール

### モックモード

`NEXT_PUBLIC_MOCK_MODE=true` の場合、API を呼び出さず `src/lib/mockData.ts` のデータを使用する。会場ネットワーク障害時のフォールバックとして必ず実装する。

### `stepDelay` の調整

`NEXT_PUBLIC_STEP_DELAY_MS` で Inside the Agent の1ステップ表示時間を制御する。

- 開発・リハーサル：`1000`（素早く確認）
- 本番（デモ当日）：`9500`（説明しながら進める）

### ハードコードの許容

デモ専用データ（商談16件・ユーザー2名）は `src/lib/mockData.ts` にハードコードする。本番では Salesforce/MCP 連携に差し替える箇所であることをコメントで明示する。

```typescript
// NOTE: デモ用静的データ。本番実装では Salesforce MCP 経由のデータに置換する
export const OPPORTUNITIES: Opportunity[] = [ ... ]
```
