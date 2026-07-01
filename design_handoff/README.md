# Handoff: AI Agent Portal — ライブデモ画面

## Overview
「AI Agent Portal」は、カンファレンス登壇（聴衆約1,000名）で**ライブデモ**するための1画面アプリです。目的は、**「AIエージェントはログインユーザーの権限（RBAC）の範囲でしかデータを返せない」**という認証・認可の概念を、画面を見るだけで直感的に理解させること。

登壇者が操作し、以下を見せます:
1. Microsoft アカウントでログイン
2. チャットでエージェントに質問 → 回答が Markdown（表付き）でストリーミング表示
3. 右パネルの「Inside the Agent」シーケンス図が、認証・認可フローをリアルタイムで進行表示
4. 初回のみ ④CData OAuth で**コンセント待ち**になり、承認ボタンで再開（デモの山場）
5. ヘッダーでユーザーを切替（田中＝営業担当／山田＝マネージャー）→ 同じ質問を再送すると、**取得件数とフィルタが変化**（田中=8件・owner固定／山田=16件・フィルタなし）

## About the Design Files
このバンドルに含まれる `AI Agent Portal.dc.html` は、**HTML で作成したデザインリファレンス（プロトタイプ）**です。見た目と挙動の意図を示すものであり、そのまま本番投入するコードではありません。

タスクは、この HTML デザインを **ターゲットのコードベースの既存環境（React / Vue / Next.js など）とパターン・ライブラリを使って再現**することです。まだ環境が無い場合は、プロジェクトに最適なフレームワークを選定して実装してください。

> 補足: 元ファイルは社内の「Design Component」ランタイム（`support.js`）上で動く独自形式（`.dc.html`）です。ロジックは素の JavaScript のクラス、テンプレートはインラインスタイルの HTML です。**ランタイムに依存せず、素の React 等へ移植**してください（後述の State / ロジックの記述で十分に再現可能です）。

## Fidelity
**High-fidelity (hifi)** です。最終的な配色・タイポグラフィ・余白・レイアウト・インタラクション・アニメーションまで作り込まれています。既存コードベースのライブラリ／パターンを使いつつ、**ピクセル単位で忠実に再現**してください。

- フォント: **Noto Sans JP**（Google Fonts, weight 400/500/600/700）
- Markdown レンダリング: `marked`（v12 相当）を使用。エージェント回答は Markdown 文字列 → HTML。
- 対象解像度: **1920×1080 固定**（外部モニター出力・Chrome）。レスポンシブ不要。

---

## Screens / Views

全体は**単一ページ**で、2状態（ログイン／ポータル）を内部 state で切替。

### 1. ログイン画面
- **Purpose**: Microsoft アカウントでのサインインを模したエントリ。
- **Layout**: 画面中央にカード1枚。背景は `radial-gradient(120% 120% at 50% 0%, #FFFFFF 0%, #EAEEF4 100%)`。
- **Components**:
  - カード: `width:452px`、`background:#fff`、`border:1px solid #E2E8F0`、`border-radius:20px`、`padding:52px 46px 40px`、`box-shadow:0 30px 70px -24px rgba(15,30,61,.28)`、中央寄せ。
  - ロゴ: `60×60`、`border-radius:16px`、`background:linear-gradient(135deg,#2563EB,#152C55)`、中に白のシールド＋チェックの SVG（`stroke:#fff`）。
  - 見出し `AI Agent Portal`: `font-size:27px; font-weight:700; margin:24px 0 8px`。
  - サブテキスト `社内ビジネスデータを、あなたの権限で`: `font-size:15px; color:#64748B; margin-bottom:34px`。
  - ボタン `Microsoft アカウントでログイン`: `width:100%; height:50px; background:#fff; border:1px solid #8C8C8C; border-radius:6px; font-size:15px; font-weight:600; color:#3B3B3B`。hover で `background:#F8FAFC`。左に Microsoft 4色ロゴ（2×2 グリッド、各 `9×9`、`gap:2px`、色 = 左上 `#F25022`／右上 `#7FBA00`／左下 `#00A4EF`／右下 `#FFB900`）。押下で状態を `portal` に遷移。
  - フッター `Powered by Microsoft Foundry × CData Connect AI`: `font-size:12px; color:#94A3B8; margin-top:36px`。

### 2. ポータル画面
ヘッダー（固定 `height:78px`）＋本体 2カラム（左=チャット、右=シーケンス図）。

#### ヘッダー（`height:78px; background:#0F1E3D; color:#fff; padding:0 32px; 左右 space-between`）
- **左**: ロゴ（`42×42`, `border-radius:11px`, `linear-gradient(135deg,#2563EB,#152C55)`, 白シールドSVG）＋アプリ名 `AI Agent Portal`（`font-size:24px; font-weight:700`）。
- **右**: ユーザー切替トリガー（クリックでドロップダウン）＋ログアウトボタン。
  - アバター円 `46×46`, `border-radius:50%`, 背景 = 役職色, 白のイニシャル `font-size:19px; font-weight:700`。
  - 氏名 `font-size:18px; font-weight:600`。
  - 役職バッジ: `font-size:13.5px; font-weight:700; padding:3px 10px; border-radius:7px`。色は下記。
  - シェブロン（下向き）SVG `20×20`, `color:#94A3B8`。
  - ログアウトボタン: `46×46`, `border-radius:11px`, `background:rgba(255,255,255,.06)`, アイコン `color:#94A3B8`（hover で `rgba(255,255,255,.13)` / `#fff`）。
- **ユーザー切替ドロップダウン**（`showMenu` true 時）: トリガー直下に絶対配置。`width:344px; background:#fff; border:1px solid #E2E8F0; border-radius:14px; box-shadow:0 24px 54px -14px rgba(15,30,61,.4); padding:10px`。見出し `ユーザー切替`（`font-size:13px; color:#94A3B8`）。各行 = アバター（`44×44`）＋氏名（`17px/600`）＋役職バッジ（`13px/700`）＋現在選択なら右に `●`（`#2563EB`）。行 hover `background:#F1F5F9`。背後に全画面透明オーバーレイ（クリックで閉じる）。

##### ユーザー定義
| key | 氏名 | イニシャル | 役職 | 役職文字色 | 役職背景 | アバター背景 |
|---|---|---|---|---|---|---|
| tanaka | 田中 一郎 | 田 | 営業担当 | `#2563EB` | `#DBEAFE` | `#2563EB` |
| yamada | 山田 花子 | 山 | 営業マネージャー | `#7C3AED` | `#EDE9FE` | `#7C3AED` |

初期選択は **tanaka**。

#### 左カラム: チャット（`flex:1; background:#fff; border-right:1px solid #E2E8F0; flex column`）
- **ヘッダー**（`padding:22px 32px; border-bottom:1px solid #E2E8F0`）: `エージェントに質問する`（`23px/700`）＋サブ `Salesforce の商談データを自然言語で照会`（`15px; #94A3B8`）。
- **メッセージ領域**（`flex:1; overflow-y:auto; padding:22px 32px; flex column; gap:16px`、新着で最下部へ自動スクロール）:
  - 空状態: 中央に `下のプリセットから質問を選ぶか、自由に入力してください`（`17px; #94A3B8`）。
  - ユーザー発言: 右寄せ吹き出し。`max-width:84%; background:#0F1E3D; color:#fff; padding:14px 19px; border-radius:16px 16px 5px 16px; font-size:18px; line-height:1.55`。
  - エージェント発言: 左寄せ。`max-width:96%; background:#F1F5F9; color:#0F172A; border:1px solid #E2E8F0; padding:16px 20px; border-radius:16px 16px 16px 5px; font-size:18px; line-height:1.7`。**中身は Markdown を HTML 化して表示**（下記 `.md-body` スタイル）。ストリーミング中は末尾に点滅キャレット（`width:2px; height:18px; background:#0F1E3D; animation:blinkCaret .9s step-end infinite`）。
  - 思考中: 3つのドット（`7×7; #94A3B8; animation:bounceDot 1.2s infinite`、遅延 0 / .18s / .36s）を吹き出し内に表示。
- **フッター**（`border-top:1px solid #E2E8F0; padding:16px 24px 18px`）:
  - プリセット3ボタン（横並び `flex; gap:10px`、各 `flex:1 1 0`）: `background:#F8FAFC; border:1px solid #E2E8F0; color:#334155; font-size:15px; padding:13px 10px; border-radius:9px`。hover `background:#EEF2F7; border-color:#CBD5E1`。ラベル = 「今月のパイプラインを見せて」「金額が大きい順に並べて」「クローズが近い商談を教えて」。
  - 入力欄＋送信ボタン（`flex; gap:10px`）: input `height:54px; border:1px solid #CBD5E1; border-radius:11px; padding:0 18px; font-size:18px`（focus で `border-color:#2563EB`）。送信ボタン `54×54; background:#0F1E3D; border-radius:11px`、白の紙飛行機 SVG。hover `#1B3055`。
  - 処理中（`busy = querying || awaitingConsent`）はプリセット/入力/送信を `disabled`。

#### 右カラム: Inside the Agent（シーケンス図）— **本デザインの核心**
`width:880px; background:#0F1E3D; color:#E2E8F0; flex column`。

- **ヘッダー**（`padding:16px 30px; border-bottom:1px solid rgba(255,255,255,.08)`）: 虫めがね SVG（`26×26; stroke:#60A5FA`）＋ `Inside the Agent`（`24px/700; #fff`）＋サブ `認証・認可フローをリアルタイムに可視化`（`15.5px; #64748B`）。
- **参加者ヘッダー**（`display:flex; padding:12px 20px 6px`、6列を均等 `flex:1`）: 各列は アイコン箱（`46×46; border-radius:13px; border:1.5px solid; background`）＋ラベル（`13px/700`）＋サブ（`10.5px; #475569`）。
  - 参加者（左→右, index 0–5）と色（アイコン/ボーダー）:
    1. **社内ユーザー**（Entra アカウント）`#94A3B8` — 人物アイコン
    2. **Entra ID**（認証・認可基盤）`#FBBF24` — 錠前アイコン
    3. **Web App**（社内ポータル）`#7DD3FC` — ブラウザ窓アイコン
    4. **Foundry**（Agent Service）`#A78BFA` — きらめき（4芒星）アイコン
    5. **CData**（Connect AI MCP）`#4ADE80` — リンクアイコン
    6. **Salesforce**（データソース）`#22D3EE` — 雲アイコン
  - アクティブな参加者（進行中セクションの端点）はボーダーを自色に、ラベルを `#F8FAFC` にハイライト。非アクティブは `boxBg:rgba(255,255,255,.035); border:rgba(255,255,255,.14); ラベル:#94A3B8`。
- **図本体**（`flex:1; overflow-y:auto; overflow-x:hidden; padding:6px 20px 16px`、position:relative の内側ラッパー）:
  - **ライフライン**: 各参加者の中心 X（`(i+0.5)/6*100 %` = 8.33/25/41.67/58.33/75/91.67%）に縦点線。`width:2px; background:repeating-linear-gradient(#334155 0 6px, transparent 6px 12px); opacity:.5`。図全体の高さ分。
  - **5セクション**（各セクション = ヘッダーバー＋メッセージ群）。ヘッダーバー: `background:<tint>; border-left:3px solid <accent>; padding:7px 14px; border-radius:0 8px 8px 0` に、状態バッジ（`23×23` 円）＋タイトル（`14px/700`）。`data-sec="<0..4>"` 属性を付与（自動スクロールの対象）。
  - **メッセージ**（各 `position:relative; height:64px`、コンセント行のみ `128px`）:
    - ラベル: 矢印スパンの中央上（`top:5px`, `font-size:13px/600`, 背景 `#0F1E3D` の帯で下線を隠す）。
    - 矢印線（`top:38px`）: 実線=要求（`height:2px; background:<色>`）、破線=応答（`border-top:2px dashed <色>`）。始点→終点は参加者中心 X 間。矢じり（三角、`border-left/right:11px solid <色>`）を終点側に。進行中は `animation:seqPulse 1.1s ease-in-out infinite`。
    - 注記トークン（`top:46px` 中央）: 小ピル `font-size:11px/700; padding:1px 7px; border-radius:5px`。色: Entra=`bg rgba(245,158,11,.16)/#FBBF24`、CData=`rgba(22,163,74,.22)/#4ADE80`、SF=`rgba(236,72,153,.22)/#F9A8D4`。
    - 自己ループ（③のみ）: Foundry ライフライン上に小さな半角ループ（`26×24; border:2px solid <色>; border-left:none; border-radius:0 8px 8px 0`）＋右にラベル。
  - **矢印/バッジ/セクションの色は所属ステップの状態で決まる**（下記 State）。

##### セクションとメッセージ（正しい認証・認可フロー）
各セクションは flow ステップ 0–4 に対応。`s`/`d` は参加者 index、`→`=実線(要求)、`⇠`=破線(応答)。

- **① ユーザー認証（Entra ID）** — accent `#3B82F6`, tint `rgba(59,130,246,.10)`
  - 社内ユーザー(0) → Entra ID(1): `ログインリクエスト`
  - Entra ID(1) ⇠ 社内ユーザー(0): `ID Token 発行`（注記: `ID Token` / Entra）
- **② Web App → Foundry（OBO トークン交換）** — accent `#8B5CF6`, tint `rgba(139,92,246,.10)`
  - 社内ユーザー(0) → Web App(2): `プロンプト送信`
  - Web App(2) → Entra ID(1): `OBO トークン要求`（注記: `assertion + scope` / Entra）
  - Entra ID(1) ⇠ Web App(2): `Foundry 用 Access Token`（注記: `Entra`）
  - Web App(2) → Foundry(3): `Agent API 呼び出し`（注記: `Bearer: Entra Token`）
- **③ Foundry 内部処理** — accent `#22C55E`, tint `rgba(34,197,94,.10)`
  - Foundry(3) 自己ループ: `RBAC チェック（Foundry User）`
  - Foundry(3) 自己ループ: `Tool Approval`
- **④ OAuth identity passthrough（初回のみ）** — accent `#3B82F6`, tint `rgba(59,130,246,.10)`
  - Foundry(3) ⇠ Web App(2): `oauth_consent_request`（破線）
  - Web App(2) ⇠ 社内ユーザー(0): `コンセントリンク表示`（破線）
  - 社内ユーザー(0) → CData(4): `CData OAuth でサインイン・コンセント`（**teal 特別色 `#38BDF8`**、この行に**コンセント承認ボタン**）
  - CData(4) ⇠ Foundry(3): `CData OAuth Token 発行・保管`（破線, 注記 `CData`）
- **⑤ データアクセス（2回目以降：自動）** — accent `#EC4899`, tint `rgba(236,72,153,.09)`
  - Foundry(3) → CData(4): `MCP ツール呼び出し`（注記 `Bearer: CData Token`）
  - CData(4) → Salesforce(5): `ユーザー権限でクエリ`（注記 `SF OAuth Token`）
  - Salesforce(5) ⇠ CData(4): `権限範囲内のデータ`（破線、注記 = フィルタ式。田中: `owner = '田中 一郎'` / 山田: `全担当（マネージャー権限）`）
  - CData(4) ⇠ Foundry(3): `ツール結果`（破線）
  - Foundry(3) ⇠ Web App(2): `Agent 応答`（破線）
  - Web App(2) ⇠ 社内ユーザー(0): `結果表示`（破線）

- **トークン凡例**（フッター, `border-top:1px solid rgba(255,255,255,.08); padding:13px 30px; flex; gap:24px`）: `■ Entra Token`(`#F59E0B`) / `■ CData Token`(`#16A34A`) / `■ SF Token`(`#EC4899`)。各 `swatch 15×15; border-radius:4px`＋ラベル `15px; #94A3B8`。

---

## Interactions & Behavior

### ログイン → ポータル
- Microsoft ボタン押下で `screen: 'login' → 'portal'`。

### 質問送信 → フロー進行（`send(text, mode)`）
1. ユーザー発言をチャットに追加、`querying=true; thinking=true`、`flow=[idle×5]`、`sortMode=mode`。
2. 400ms 待機後、ステップ 0→4 を順に `processing`（`stepDelay` ミリ秒表示）→ `done`（間 500ms）。
3. **ステップ3（④CData OAuth）到達時、`consentGiven` が false かつ `requireConsent` が true なら `waiting` で停止**（`awaitingConsent=true`）。コンセント承認ボタンが出現。
4. `stepDelay` は既定 **9500ms**（1セクション約10秒。プレゼンで説明しながら進める想定）。Tweak で 1000–15000ms 可変。
5. 各ステップ遷移で、**アクティブなセクションが図の最上部に来るよう自動スクロール**（`data-sec` 要素の `offsetTop` へ `scrollTop` を即時設定）。

### コンセント承認（`approveConsent()`）
- `consentGiven=true; awaitingConsent=false` にし、ステップ3を `processing→done`、続けてステップ4を `processing→done` 後に `finish()`。
- `consentGiven` は一度 true になると保持（2回目以降・ユーザー切替後は④で止まらない）。

### 完了（`finish()`）
- `dataVisible=true; querying=false; thinking=false`。
- エージェント回答を生成:
  - イントロ（Markdown、太字で件数・合計）を**タイプライター表示**（22ms/文字）。
  - 250ms 後、**フィルタ表記＋商談テーブル（Markdown）を一括追加**して確定表示。
- 回答テキスト例（田中）:
  ```
  **田中 一郎** さんの権限で、担当商談を **8件** 取得しました。合計 **¥79,000,000**。

  **適用フィルタ:** `owner = '田中 一郎'`

  | 商談名 | ステージ | 金額 | 担当者 | クローズ |
  |:--|:--|--:|:--|:--|
  | アクロス 基幹システム更改 | <span …>Negotiation</span> | ¥12,000,000 | 田中 一郎 | 7/15 |
  … （田中は8行 / 山田は16行）

  あなたが所有する商談のみが表示されています。
  ```
  ステージセルは色付きバッジ（`<span style="background:…;color:…;padding:2px 9px;border-radius:6px;font-size:13px;font-weight:700">`）を Markdown セル内にインライン HTML で埋め込む。

### ユーザー切替（`selectUser(key)`）
- `user` を切替、メニューを閉じる。**チャット履歴は保持**。切替後に同じ質問を再送すると、新しい回答（件数・フィルタが変化）が追加される。
- 切替でシーケンス図の⑤フィルタ注記も変化（田中=`owner = '田中 一郎'` / 山田=`全担当（マネージャー権限）`）。

### ログアウト（`logout()`）
- `screen:'login'` に戻し、`messages/flow/dataVisible/consentGiven/awaitingConsent/querying` をリセット。

### アニメーション（`@keyframes`）
- `spin` 0.8s linear infinite（処理中スピナー）
- `pulseDot` 1.1s（待機バッジ）
- `bounceDot` 1.2s（思考ドット）
- `blinkCaret` 0.9s step-end（タイプライターのキャレット）
- `rowIn` 0.35s ease（テーブル行の登場・任意）
- `consentGlow` 1.6s ease-in-out infinite（コンセントボタンの発光）
- `seqPulse` 1.1s ease-in-out infinite（進行中の矢印線）

---

## State Management
ルートコンポーネントの state:
- `screen`: `'login' | 'portal'`（初期 `'login'`）
- `user`: `'tanaka' | 'yamada'`（初期 `'tanaka'`）
- `showMenu`: boolean（ユーザー切替メニュー）
- `input`: string（入力欄）
- `messages`: `Array<{ role:'user'|'agent', text:string, streaming?:boolean }>`
- `thinking`: boolean（思考ドット表示）
- `flow`: `string[5]`（各要素 `'idle'|'processing'|'waiting'|'done'|'error'`）— シーケンスの5ステップ状態
- `awaitingConsent`: boolean
- `consentGiven`: boolean（セッション内保持）
- `dataVisible`: boolean
- `querying`: boolean
- `sortMode`: `'pipeline'|'amount'|'close'`（プリセットに対応した表示ソート）

非state:
- `runId`（実行トークン。再送時に古い非同期処理を無効化）

### プロップ（Tweak 可能な設定）
- `stepDelay`（number, 既定 9500, 範囲 1000–15000, 単位 ms）: 1ステップの表示時間。
- `requireConsent`（boolean, 既定 true）: 初回コンセント停止の ON/OFF。

### 表示ソート（`sortMode`）
- `pipeline`: デフォルト順
- `amount`: 金額降順
- `close`: クローズ日 昇順
プリセット「今月のパイプラインを見せて」=pipeline / 「金額が大きい順に並べて」=amount / 「クローズが近い商談を教えて」=close。入力欄からの送信は pipeline。

### データ取得（デモ用・すべてローカル定義）
- 商談データは静的配列（16件、下記）。表示は `user==='yamada'` なら全16件、`tanaka` なら `owner==='田中 一郎'` の8件にフィルタ。
- 本番実装では Salesforce/MCP 連携に置換する箇所（ここではモック）。金額は `¥{n.toLocaleString('ja-JP')}`。応答時間 `234ms` は演出用の固定値。

#### 商談データ（`name, stage, amount(JPY), owner, close(YYYY-MM-DD)`）
```
アクロス 基幹システム更改, Negotiation, 12000000, 田中 一郎, 2026-07-15
グローバルテック クラウド移行, Proposal, 8500000, 田中 一郎, 2026-07-28
日本ロジ WMS導入, Prospecting, 5200000, 田中 一郎, 2026-08-10
さくら製造 IoT基盤構築, Negotiation, 18700000, 田中 一郎, 2026-07-20
みらい銀行 データ分析基盤, Qualification, 9300000, 田中 一郎, 2026-08-05
東西商事 ERP刷新, Closed Won, 15400000, 田中 一郎, 2026-06-30
ネクストフーズ POS連携, Prospecting, 3800000, 田中 一郎, 2026-08-22
スカイ観光 予約システム, Proposal, 6100000, 田中 一郎, 2026-07-31
富士エンジ MES導入, Negotiation, 22000000, 佐藤 健, 2026-07-18
大和HD 統合基盤, Proposal, 14500000, 佐藤 健, 2026-08-02
オリオン製薬 品質管理SaaS, Closed Won, 7700000, 鈴木 美咲, 2026-06-28
ブライトリテール EC基盤, Qualification, 11200000, 鈴木 美咲, 2026-08-12
常盤エナジー 需要予測AI, Prospecting, 9900000, 佐藤 健, 2026-08-25
かえで生命 契約管理, Negotiation, 16800000, 鈴木 美咲, 2026-07-22
ゼニス自動車 部品調達, Proposal, 13300000, 佐藤 健, 2026-08-08
つばさ航空 運航管理, Closed Won, 20500000, 鈴木 美咲, 2026-07-05
```

---

## Design Tokens

### カラー
| 用途 | 値 |
|---|---|
| メイン（ヘッダー/右パネル/濃色） | `#0F1E3D` |
| ページ背景（左カラム外） | `#F1F5F9` / `#F8FAFC` |
| カード/チャット背景 | `#FFFFFF` |
| ボーダー | `#E2E8F0` / 薄 `#F1F5F9` |
| テキスト | 主 `#0F172A` / 副 `#475569` / 微 `#64748B` / プレースホルダ `#94A3B8` |
| 役職: 営業担当 | 文字 `#2563EB` / 背景 `#DBEAFE` |
| 役職: マネージャー | 文字 `#7C3AED` / 背景 `#EDE9FE` |
| Entra Token | `#F59E0B`（濃色上のアクセント `#FBBF24`） |
| CData Token | `#16A34A`（アクセント `#4ADE80`） |
| SF Token | `#EC4899`（アクセント `#F9A8D4`） |
| 状態: 完了 | `#22C55E` / `#4ADE80` |
| 状態: 処理中 | `#3B82F6` / `#60A5FA` |
| 状態: 待機 | `#FBBF24` |
| 状態: エラー | `#EF4444` |
| teal（サインイン矢印） | `#38BDF8` |
| Microsoft ロゴ | `#F25022` / `#7FBA00` / `#00A4EF` / `#FFB900` |

### ステージ別バッジ色（`背景 / 文字`）
| ステージ | 背景 | 文字 |
|---|---|---|
| Prospecting | `#F1F5F9` | `#475569` |
| Qualification | `#DBEAFE` | `#1D4ED8` |
| Proposal | `#E0E7FF` | `#4338CA` |
| Negotiation | `#FEF3C7` | `#B45309` |
| Closed Won | `#DCFCE7` | `#15803D` |
| Closed Lost | `#FEE2E2` | `#B91C1C` |

### タイポグラフィ
- フォント: `'Noto Sans JP', sans-serif`
- 主なサイズ: 見出し 23–27px / セクションタイトル 14px / 本文・テーブル 18px / 参加者ラベル 13px / 注記 11px / サブテキスト 10.5–15.5px
- ウェイト: 400 / 500 / 600 / 700

### 角丸・影
- 角丸: ボタン 6–11px / カード 14–20px / バッジ 5–9px / 吹き出し 16px（1角のみ 5px）
- 影: カード `0 30px 70px -24px rgba(15,30,61,.28)` / メニュー `0 24px 54px -14px rgba(15,30,61,.4)`

### レイアウト寸法
- 画面: `1920×1080` 固定
- ヘッダー: `height:78px`
- 右パネル（シーケンス図）: `width:880px` 固定、左カラムは `flex:1`
- 参加者中心 X: `(i+0.5)/6×100%`（6等分）
- シーケンス各行: `height:64px`（コンセント行 `128px`）

### `.md-body`（エージェント回答の Markdown レンダリング CSS）
```css
.md-body > *:first-child { margin-top:0; }
.md-body > *:last-child { margin-bottom:0; }
.md-body p { margin:0 0 12px; }
.md-body strong { font-weight:700; color:#0F1E3D; }
.md-body code { font-family:'SFMono-Regular',Consolas,Menlo,monospace; font-size:.86em; background:#E7ECF3; color:#1B3A6B; padding:2px 7px; border-radius:6px; }
.md-body ul { margin:8px 0 12px; padding-left:22px; }
.md-body li { margin:3px 0; }
.md-body table { border-collapse:separate; border-spacing:0; width:100%; margin:14px 0 6px; background:#fff; border:1px solid #E2E8F0; border-radius:11px; overflow:hidden; font-size:15.5px; }
.md-body thead th { background:#F1F5F9; text-align:left; padding:11px 15px; font-size:13px; font-weight:700; color:#64748B; letter-spacing:.02em; border-bottom:1px solid #E2E8F0; white-space:nowrap; }
.md-body tbody td { padding:12px 15px; border-bottom:1px solid #F1F5F9; color:#0F172A; vertical-align:middle; }
.md-body tbody tr:last-child td { border-bottom:none; }
.md-body tbody td:first-child { font-weight:600; }
.md-body th[align="right"], .md-body td[align="right"] { text-align:right; font-variant-numeric:tabular-nums; font-weight:700; }
```

---

## Assets
- **フォント**: Noto Sans JP（Google Fonts）。本番では既存のフォント基盤に合わせて可。
- **アイコン**: すべてインライン SVG（stroke ベース、`stroke-width` 2 前後）。人物 / 錠前 / ブラウザ窓 / きらめき(4芒星) / リンク / 雲 / 虫めがね / 紙飛行機(送信) / シェブロン / ログアウト / チャット吹き出し / カレンダー。既存のアイコンライブラリ（Lucide 等）で同義のものに置換可。
- **Microsoft ロゴ**: 4色の正方形（CSS グリッドで再現、画像不要）。
- **Markdown**: `marked` v12 相当。既存の Markdown レンダラ（react-markdown 等）でも可。**ステージバッジのためにインライン HTML（span）を許可**する設定にすること（サニタイズ時は style 属性を残す）。
- 画像アセットは無し（すべて CSS/SVG）。

> 注: Microsoft / Entra ID / Foundry / CData / Salesforce はデモの題材としての名称。実装先のブランドガイドラインに従って表記・ロゴを扱ってください。

---

## Files
- `AI Agent Portal.dc.html` — 完全なデザインリファレンス（単一ファイル、ブラウザで直接開けます）。ログイン→ポータルの全状態・全インタラクションが動作します。挙動やタイミング、配色の最終確認はこのファイルを実際に操作して確認してください。

### 実装の進め方（推奨）
1. `AI Agent Portal.dc.html` をブラウザで開き、ログイン→送信→④コンセント承認→ユーザー切替→再送 の一連を操作して挙動・タイミングを把握。
2. 上記 State を持つルートコンポーネントを作成（React 等）。
3. ログイン／ヘッダー／チャット／シーケンス図の4ブロックを実装。シーケンス図は「参加者ヘッダー＋ライフライン＋セクション×メッセージ」の宣言的データ（上記の①〜⑤定義）から描画するとメンテしやすい。
4. `send`/`approveConsent`/`finish` の非同期進行（`runId` によるキャンセル、`stepDelay` 間隔、④での `waiting` 停止）を実装。
5. Markdown レンダラを組み込み、回答の生成（イントロのタイプライター＋テーブル一括表示）を実装。
6. Salesforce/MCP 連携部分（現状は静的モック）を実データに差し替え。
