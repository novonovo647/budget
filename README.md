# Web アプリ（PWA）

Vue 3 製の Web アプリ（PWA）です。認証とデータ同期に Firebase（Authentication / Firestore）を利用します。

## 主な機能

- 🔐 **Google 認証** — ログインユーザーのみ編集可能
- ☁️ **リアルタイム同期** — Firestore による複数端末・複数ユーザー間の同期
- 🕘 **データ復旧** — 世代バックアップからの復元
- 📱 **PWA 対応** — ホーム画面へのインストール、オフライン表示

## 技術構成

| 分類 | 使用技術 |
|------|----------|
| フロントエンド | [Vue 3](https://vuejs.org/)（Composition API / `<script setup>`） |
| ビルドツール | [Vite 6](https://vitejs.dev/) |
| 認証・DB | [Firebase](https://firebase.google.com/)（Authentication / Firestore） |
| デプロイ | GitHub Pages（GitHub Actions による自動デプロイ） |

## セットアップ

前提: Node.js 20 以上

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

### Firebase の設定

このアプリは Firebase（Authentication / Firestore）を利用します。利用する場合は、自身の Firebase プロジェクトを作成し、[src/firebase.js](src/firebase.js) の設定値を置き換えてください。

アクセス制御は **Firestore セキュリティルール**で行います。認証済みかつ許可されたユーザーのみ読み書きできるようにルールを設定してください（例）:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email in ['your-email@example.com'];
    }
  }
}
```

> **Note**: Firebase の Web API キーは公開されても問題ありません（クライアント設定であり秘密情報ではない）。アクセス制御は上記の Firestore ルールで担保されます。

## プロジェクト構成

```
src/
  App.vue                  # ルートコンポーネント
  firebase.js              # Firebase 初期化
  main.js                  # エントリーポイント
  components/              # UI コンポーネント
  composables/             # 認証・データ取得/管理
  lib/                     # Firestore 永続化・バックアップ
  utils/                   # 計算・整形・定数等のユーティリティ
public/
  manifest.json            # PWA マニフェスト
  sw.js                    # Service Worker
```

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。
