# Vercel デプロイメント設定ガイド

## セットアップ手順

### 1. Tursoデータベースの作成
Vercelにデプロイする前に、[Turso](https://turso.tech/)でアカウントを作成し、データベースを作成してください。

```bash
# Turso CLI をインストール
npm install -g @tursodatabase/cli

# Tursoにログイン
turso auth login

# 新しいデータベースを作成
turso db create my-db

# データベースURLとトークンを取得
turso db show my-db --json
```

### 2. 環境変数の設定
Vercel ダッシュボードで以下の環境変数を設定してください：

- `TURSO_DATABASE_URL`: Tursoデータベースの接続URL
- `TURSO_AUTH_TOKEN`: Tursoの認証トークン

### 3. デプロイ
```bash
# Vercelにデプロイ
vercel deploy --prod
```

または、GitHub リポジトリを Vercel に接続して自動デプロイを設定してください。

## ローカル開発

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev

# Vercel開発環境をシミュレート
npm run vercel-dev
```

## ファイル構造

```
api/              # Vercel Serverless Functions
├── cases.ts      # /api/cases エンドポイント
src/              # フロントエンド
db/               # データベース設定
types/            # TypeScript型定義
dist/             # ビルド出力
```

## API エンドポイント

### GET /api/cases
全てのケースを取得します。

### POST /api/cases
新しいケースを作成します。

```json
{
  "title": "ケースのタイトル"
}
```

## トラブルシューティング

### ローカルとVercelで異なるデータベース
- ローカル: SQLite (`local.db`)
- Vercel: Turso

`db/client.ts` で環境に応じて自動的に切り替わります。

### モジュールが見つからないエラー
```bash
npm install
npm run build
```

### デプロイ失敗
Vercel ダッシュボードの "Deployments" タブからログを確認してください。
