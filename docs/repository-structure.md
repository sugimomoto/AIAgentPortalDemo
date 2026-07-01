# リポジトリ構造定義書

> バージョン：1.0　作成日：2026年7月1日　作成者：杉本 和也

---

## 1. 全体構造

```
ai-agent-portal/
├── .devcontainer/
│   └── devcontainer.json        # 開発コンテナ定義（Node 20 / Vitest / Playwright）
├── .claude/
│   └── launch.json              # Claude Code プレビューサーバー設定
├── .steering/                   # 作業単位のステアリングファイル
│   └── 20260701-initial-implementation/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
├── docs/                        # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md  # 本ファイル
│   ├── development-guidelines.md
│   └── glossary.md
├── design_handoff/              # Claude Design からのハンドオフファイル
│   ├── AI Agent Portal.dc.html  # デザインリファレンス（閲覧用）
│   └── README.md
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # ルートレイアウト（フォント・グローバルCSS）
│   │   ├── page.tsx             # ルート（認証状態に応じてリダイレクト）
│   │   ├── login/
│   │   │   └── page.tsx         # ログイン画面
│   │   ├── portal/
│   │   │   └── page.tsx         # ポータル画面（メイン）
│   │   └── api/
│   │       ├── agent/
│   │       │   └── route.ts     # Foundry Agent API 呼び出し（SSE）
│   │       └── auth/
│   │           └── token/
│   │               └── route.ts # OBO トークン交換
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx       # ヘッダー（ユーザー情報・切替ドロップダウン）
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx    # チャットパネル全体
│   │   │   ├── MessageList.tsx  # メッセージ履歴リスト
│   │   │   ├── MessageBubble.tsx# メッセージ吹き出し（Markdown レンダリング含む）
│   │   │   ├── PresetButtons.tsx# プリセットプロンプトボタン
│   │   │   └── ChatInput.tsx    # テキスト入力欄＋送信ボタン
│   │   └── agent/
│   │       ├── InsideAgentPanel.tsx  # Inside the Agent パネル全体
│   │       ├── ParticipantHeader.tsx # 参加者ヘッダー（6者）
│   │       ├── SequenceSection.tsx   # セクション（①〜⑤）
│   │       ├── SequenceMessage.tsx   # 矢印メッセージ1本分
│   │       ├── Lifeline.tsx          # ライフライン（縦点線）
│   │       ├── TokenBadge.tsx        # トークン種別バッジ（色分け）
│   │       ├── ConsentButton.tsx     # CData コンセントリンクボタン
│   │       └── TokenLegend.tsx       # フッターのトークン凡例
│   ├── hooks/
│   │   ├── useAuth.ts           # Entra ID 認証・トークン管理
│   │   ├── useAgent.ts          # エージェント呼び出し・SSE 受信
│   │   └── useAgentFlow.ts      # Inside the Agent フロー状態管理
│   ├── lib/
│   │   ├── msal.ts              # MSAL 設定（PublicClientApplication）
│   │   ├── foundry.ts           # Foundry Agent SDK クライアント
│   │   ├── mockData.ts          # デモ用静的商談データ（16件）
│   │   └── types.ts             # 共通型定義
│   └── styles/
│       └── globals.css          # グローバルCSS（Tailwind base・md-body スタイル）
├── .env.local                   # 環境変数（Git 管理外）
├── .env.local.example           # 環境変数のテンプレート（Git 管理）
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## 2. ディレクトリの役割

### `src/app/`

Next.js App Router のルーティング。ページコンポーネントと API Routes を配置。

| パス | 役割 |
|------|------|
| `app/page.tsx` | 認証状態チェック → `/login` または `/portal` へリダイレクト |
| `app/login/page.tsx` | ログイン画面。MSALの `loginPopup()` を呼び出す |
| `app/portal/page.tsx` | ポータル画面。Header / ChatPanel / InsideAgentPanel を並べる |
| `app/api/agent/route.ts` | Foundry Agent API を呼び出し SSE でストリーミング返却 |
| `app/api/auth/token/route.ts` | OBO トークン交換。クライアントシークレットはここにのみ置く |

### `src/components/`

UI コンポーネント。3グループに分類。

| グループ | 内容 |
|---------|------|
| `layout/` | ヘッダーなどページ共通の構造コンポーネント |
| `chat/` | チャット UI 関連（メッセージ・入力・プリセット） |
| `agent/` | Inside the Agent パネル関連（シーケンス図の描画） |

### `src/hooks/`

状態管理とビジネスロジックをカスタムフックに分離。

| フック | 役割 |
|--------|------|
| `useAuth` | MSAL の初期化・ログイン・ログアウト・トークン取得 |
| `useAgent` | プロンプト送信・SSE 受信・メッセージ状態管理 |
| `useAgentFlow` | 5ステップのフロー状態（idle/processing/waiting/done）管理 |

### `src/lib/`

外部サービスのクライアント設定と共通ユーティリティ。

| ファイル | 内容 |
|---------|------|
| `msal.ts` | `PublicClientApplication` のシングルトン設定 |
| `foundry.ts` | `AIProjectClient` の初期化・エージェント呼び出し関数 |
| `mockData.ts` | デモ用商談データ16件・フィルタ処理・ソート処理 |
| `types.ts` | `User` / `Message` / `FlowStep` / `AgentFlow` / `Opportunity` の型定義 |

### `design_handoff/`

Claude Design から受け取ったハンドオフファイル。実装の参照用として保持。本番投入コードではない。

---

## 3. ファイル配置ルール

- **コンポーネント**：1ファイル1コンポーネント。ファイル名は PascalCase（例：`ChatPanel.tsx`）
- **フック**：`use` プレフィックス必須（例：`useAuth.ts`）
- **API Routes**：Next.js 規約に従い `route.ts` で統一
- **型定義**：原則 `src/lib/types.ts` に集約。コンポーネント固有の小さな型はそのファイル内にローカル定義可
- **環境変数**：
  - ブラウザ公開可 → `NEXT_PUBLIC_` プレフィックス
  - サーバーサイドのみ → プレフィックスなし（クライアントシークレット等）
- **スタイリング**：Tailwind クラスを優先。デザイントークンの精密な値（`#0F1E3D` 等）はインラインスタイルで指定

---

## 4. `.env.local.example`

```bash
# Entra ID
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret        # サーバーサイドのみ

# MSAL（ブラウザ公開）
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id

# Foundry（新 Foundry ポータル ai.azure.com の Project endpoint をコピー）
FOUNDRY_PROJECT_ENDPOINT=https://your-resource.services.ai.azure.com/api/projects/your-project
FOUNDRY_AGENT_NAME=your-agent-name

# デモ設定
NEXT_PUBLIC_MOCK_MODE=false                   # true にするとモックデータで動作
NEXT_PUBLIC_STEP_DELAY_MS=9500                # Inside the Agent の1ステップ表示時間（ms）
```
