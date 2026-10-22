# ふたりの地図

彼女・彼氏と二人で「行きたい場所」「行った場所（思い出）」「また行きたい場所」を記録・共有する Web アプリです。
スマホのブラウザで開き、「ホーム画面に追加」するとアプリのように使えます。

## 機能

- **種類で分類**: 場所 / 映画 / 本 / グルメ / その他（文言も「見たい」「読んだ」などに自動で切り替わる）
- **やりたい / 思い出 / またやりたい** の3つのリスト（「行った！」「見た！」ボタンで思い出へ移動）
- 日付・星評価（1〜5）・タグ・メモ・リンク・住所
- 地図表示（OpenStreetMap）と、店名・住所検索 or 地図タップでの位置指定（場所・グルメ向け）
- 付き合った日からの日数、次の100日記念・周年までのカウント
- 二人のスマホでリアルタイム同期（招待コードでペアを作成）
- 検索・種類・タグでの絞り込み、ダークモード対応
- メモは一覧に表示し、リンク欄の URL（インスタなど）は一覧からタップして開ける

## 使っているサービス（すべて無料）

| 用途 | サービス | 無料枠の目安 |
| --- | --- | --- |
| データベース・ログイン・同期 | [Supabase](https://supabase.com) Free プラン | DB 500MB、月間 5万ユーザー（二人なら十分） |
| 地図 | OpenStreetMap + Leaflet | 無料（API キー不要） |
| 住所検索 | Nominatim | 無料（1秒1回まで） |
| 公開（ホスティング） | Vercel / Cloudflare Pages / Netlify など | 個人利用は無料 |

> Supabase の無料プロジェクトは **1週間ほどデータベース利用がないと一時停止** します。このリポジトリの GitHub Actions（1日3回）と Vercel Cron（1日1回）が軽い問い合わせを送り、停止を避けます。Actions を使うには、GitHub の Secrets に `SUPABASE_URL` と `SUPABASE_ANON_KEY`（`.env.local` と同じ値）を登録し、このワークフローをデフォルトブランチへ push してください。止まってしまった場合はダッシュボードから再開すればデータは戻ります。有料プランにすると、未使用でも停止しません。

## セットアップ

### 1. Supabase プロジェクトを作る

1. https://supabase.com で無料アカウントを作成し、「New project」でプロジェクトを作成（リージョンは Tokyo 推奨）
2. 左メニュー **SQL Editor** を開き、[`supabase/schema.sql`](supabase/schema.sql) の中身をすべて貼り付けて **Run**
   - すでに一度セットアップ済みの場合は、[`supabase/migration_add_category.sql`](supabase/migration_add_category.sql) と [`supabase/migration_add_links.sql`](supabase/migration_add_links.sql) を実行してください（未実行のものだけ）
3. **Project Settings → API**（または「Connect」ボタン）から次の2つをコピー
   - Project URL
   - anon / publishable key（公開用のキー。`service_role` キーは使わないこと）

### 2. 接続設定

プロジェクト直下に `.env.local` を作成します（`.env.example` をコピー）。

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=コピーしたキー
```

### 3. ローカルで起動

```bash
npm install
npm run dev
```

http://localhost:5173 を開きます。

### 4. 二人で使い始める

1. 自分が「新規登録」→ 確認メールのリンクを開く → ログイン
2. 「新しく作る」でスペースを作成（付き合った日もここで入力）
3. 右上の ⚙ 設定に表示される **招待コード** を相手に送る
4. 相手も新規登録 → 「招待コードで参加」にコードを入力

> 確認メールが面倒な場合は、Supabase の **Authentication → Sign In / Providers → Email** で「Confirm email」をオフにできます。

## スマホから使えるように公開する（例: Vercel）

1. このフォルダを GitHub にプッシュ
2. https://vercel.com に GitHub でログイン → 「Add New Project」でリポジトリを選択
3. **Environment Variables** に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を追加して Deploy
4. Supabase の **Authentication → URL Configuration** の「Site URL」に公開された URL（例: `https://xxxx.vercel.app`）を設定
5. スマホで URL を開き、共有メニューから「ホーム画面に追加」

### インスタのリンクを残す

1. 場所を追加・編集し、「リンク」欄に Instagram の URL を入れて追加する（メモとは別）
2. 保存後、一覧の「🔗 …」をタップするとブラウザ／インスタで開きます

## セキュリティについて

- すべてのテーブルに Row Level Security を設定しており、**同じペアのメンバーだけ** がデータを読み書きできます
- 1つのペアに参加できるのは二人まで、1人が参加できるペアは1つまでです
- anon キーはブラウザに公開される前提のキーなので、フロントエンドに含めて問題ありません

## 改修後に iPhone で最新版を開く

公開（Vercel 再デプロイ）後:

1. アプリを開くと上部に「新しいバージョンがあります → 更新する」が出ることがあります
2. 出ないときは ⚙ 設定 → **最新版に更新（再読み込み）**
3. それでも古いときは、Safari で同じ URL を開き直すか、ホーム画面アイコンを一度消して追加し直してください

## 開発

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（dist/）
npm run lint     # lint
```

構成: Vite + React + TypeScript / Supabase / react-leaflet
