# 初回実装 design（設計）

> 作業：AI Agent Portal 初回実装　作成日：2026年7月1日　作成者：杉本 和也
> 関連：[requirements.md](./requirements.md) / [docs/functional-design.md](../../docs/functional-design.md) / [docs/repository-structure.md](../../docs/repository-structure.md) / `design_handoff/README.md`

---

## 1. 実装アプローチ

### 基本方針

- **テストファースト（TDD）**：ロジックは「失敗するテスト → 実装 → リファクタ」の順で進める（詳細は §6）。
- **宣言的シーケンス図**：Inside the Agent は「参加者定義＋セクション×メッセージ定義」の**データ配列**から描画する（`design_handoff/README.md` の①〜⑤定義をそのまま TypeScript データ化）。
- **mock/real 抽象化**：エージェント呼び出しは `useAgent` フックの内側で分岐。初回はモックのみ実装し、実接続は同じインターフェースで差し替える。
- **状態の単一責務**：フロー状態は `useAgentFlow`、チャットは `useAgent`、認証は `useAuth`（初回はモック）に分離。

### 段階

1. **フェーズ1（今回のゴール）**：モックモードで一気通貫動作。
2. **フェーズ2（後続）**：`useAuth`/`useAgent` の real 実装（MSAL・OBO・Responses API・CData MCP）に差し替え。

---

## 2. 変更するコンポーネント（新規作成）

構成は [docs/repository-structure.md](../../docs/repository-structure.md) に準拠。主なもの：

| 種別   | ファイル                                                                                                                                       | 責務                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| ページ | `app/page.tsx`                                                                                                                                 | 認証状態で `/login` or `/portal` へ    |
| ページ | `app/login/page.tsx`                                                                                                                           | ログイン画面（Microsoft 風カード）     |
| ページ | `app/portal/page.tsx`                                                                                                                          | ルート state 保持・3ブロック配置       |
| layout | `Header.tsx`                                                                                                                                   | ユーザー切替ドロップダウン・ログアウト |
| chat   | `ChatPanel` / `MessageList` / `MessageBubble` / `PresetButtons` / `ChatInput`                                                                  | チャット UI                            |
| agent  | `InsideAgentPanel` / `ParticipantHeader` / `SequenceSection` / `SequenceMessage` / `Lifeline` / `TokenBadge` / `ConsentButton` / `TokenLegend` | シーケンス図                           |
| hooks  | `useAuth` / `useAgent` / `useAgentFlow`                                                                                                        | 状態・ロジック                         |
| lib    | `msal.ts` / `foundry.ts` / `mockData.ts` / `tokens.ts` / `types.ts`                                                                            | 設定・データ・型                       |

> フェーズ1では `msal.ts` / `foundry.ts` は雛形（インターフェースのみ）で可。

---

## 3. データ構造

### 3-1. 型（`lib/types.ts`）

確定仕様（[docs/functional-design.md](../../docs/functional-design.md) §5）に準拠。

```typescript
type UserKey = 'tanaka' | 'yamada'
type FlowStatus = 'idle' | 'processing' | 'waiting' | 'done' | 'error'
type SortMode = 'pipeline' | 'amount' | 'close'

type User = {
  key: UserKey
  name: string
  initial: string
  jobTitle: string
  roleColor: string
  roleBg: string
  avatarBg: string
  sfProfile: string
}

type Message = { id: string; role: 'user' | 'agent'; content: string; streaming?: boolean }

type FlowStep = {
  step: 0 | 1 | 2 | 3 | 4
  label: string
  status: FlowStatus
  detail?: string
  tokenType?: 'entra' | 'cdata' | 'salesforce'
}

type Opportunity = { name: string; stage: string; amount: number; owner: string; close: string }
```

### 3-2. モックデータ（`lib/mockData.ts`）

`design_handoff/README.md` の16件をそのまま定義。純粋関数として：

- `filterByUser(list, userKey)` … 山田=全16件 / 田中=`owner==='田中 一郎'` の8件
- `sortOpportunities(list, mode)` … pipeline=定義順 / amount=金額降順 / close=クローズ日昇順
- `buildAgentAnswer(user, opps, mode)` … イントロ文＋フィルタ表記＋Markdown テーブル文字列を生成

### 3-3. シーケンス図定義（`lib/sequence.ts`）

参加者6者と①〜⑤の各メッセージ（`from`/`to` の参加者 index・ラベル・実線/破線・トークン注記）を**静的配列**で定義。⑤のフィルタ注記だけ `user` により差し替え。

---

## 4. フロー状態機械（`useAgentFlow` + `useAgent`）

`design_handoff/README.md` の `send`/`approveConsent`/`finish` を忠実に移植。

```
send(text, mode):
  1. ユーザー発言を messages に追加、querying=true, thinking=true, flow=[idle×5], sortMode=mode
  2. 400ms 後、step 0→4 を順に processing(stepDelay ms) → done(間 500ms)
  3. step3(④) 到達時、consentGiven=false かつ requireConsent=true なら waiting で停止
     （awaitingConsent=true・ConsentButton 出現）
  4. runId により、再送時は古い非同期処理を無効化

approveConsent():
  consentGiven=true, awaitingConsent=false → step3 を processing→done → step4 processing→done → finish()

finish():
  dataVisible=true, querying=false, thinking=false
  → イントロを 22ms/文字でタイプライター → 250ms 後にテーブルを一括追加
```

- `stepDelay` 既定 9500ms（`NEXT_PUBLIC_STEP_DELAY_MS`）、`requireConsent` 既定 true。
- 進行中セクションは `data-sec` 要素の `offsetTop` へ即時スクロール。

---

## 5. スタイリング / デザイントークン

- `lib/tokens.ts` に色・寸法を定数化（`#0F1E3D` / agentPanelWidth=880 / headerHeight=78 等）。
- Tailwind（汎用）＋インラインスタイル（精密値）＋ `globals.css`（`.md-body`・`@keyframes`）。
- `@keyframes`：`spin` / `pulseDot` / `bounceDot` / `blinkCaret` / `rowIn` / `consentGlow` / `seqPulse`。
- ステージバッジ色・`.md-body` は `design_handoff/README.md` の Design Tokens をそのまま採用。

---

## 6. テスト戦略（テストファースト）

| レイヤ           | ツール                         | 対象                                                                                  |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| 単体（純粋関数） | Vitest                         | `filterByUser` / `sortOpportunities` / `buildAgentAnswer`                             |
| 状態機械         | Vitest（fake timers）          | `useAgentFlow`/`send`/`approveConsent`/`finish`・④待機・`runId` キャンセル            |
| コンポーネント   | Vitest + React Testing Library | busy 中の disabled・ドロップダウン開閉・空状態・プリセット連動                        |
| E2E（受け入れ）  | Playwright                     | requirements §4 の受け入れ条件シナリオ（田中8件→山田16件・④コンセント停止・履歴保持） |

**進め方**：各機能で「①失敗するテストを書く → ②最小実装で green → ③リファクタ」。
テストのタイミング制御は fake timers を使い、`stepDelay` を小さくして高速に検証する。
デザインのピクセル忠実性は自動テスト対象外とし、`design_handoff` との目視＋ Playwright スクリーンショットで確認する。

> 注：[docs/development-guidelines.md](../../docs/development-guidelines.md) §5 を「テストファースト（TDD）を基本とし、実機/目視確認を併用」に更新する（本作業で反映）。

---

## 7. 影響範囲

- 新規プロジェクトのため既存コードへの破壊的影響なし。
- 永続ドキュメントの更新は development-guidelines.md §5（テスト方針）のみ。他 `docs/` は変更不要。
