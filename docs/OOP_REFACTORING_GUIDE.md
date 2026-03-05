# オブジェクト指向設計への変更ガイド（2026年2月最新版）

このドキュメントは、管理システムのコードをオブジェクト指向パラダイムに従ってリファクタリングした内容と、現状のクラス設計・構成・拡張性・API・技術スタックをまとめたものです。

---

## 📋 変更の概要

### 変更前（関数ベース）
```javascript
// api.js
export async function getComments(articleTitle) { ... }
export async function createComment(...) { ... }

// utils.js
export function escapeHtml(text) { ... }
export function formatDateJP(...) { ... }

// admin.js
export async function handleLogin(e) { ... }
export function handleLogout() { ... }
```

### 変更後（クラスベース）
```javascript
// api.js
class APIClient {
  async getComments(articleTitle) { ... }
  async createComment(...) { ... }
}

// utils.js
class Utils {
  static escapeHtml(text) { ... }
  static formatDateJP(...) { ... }
}

// admin.js
// 各種Managerクラスを定義
class AdminManager { ... }
class ProfileManager { ... }
class CareerManager { ... }
class PDFManager { ... }
class CommentManager { ... }
class PostManager { ... }
class ContactListManager { ... }
```

---

## 🏗️ クラス設計（2026年2月最新版）

### APIClient (src/api.js)
- すべてのAPI通信を管理
- 主なメソッド: call(), getComments(), getAllComments(), createComment(), updateCommentApproval(), deleteComment(), getAllContacts(), createContact(), deleteContact(), getPosts(), createPost(), deletePost(), ほか

### Utils (src/utils.js)
- 共通ユーティリティ機能（staticメソッド）
- 主なメソッド: escapeHtml(), formatDateJP(), showElement(), toggleClass(), showMessage(), getEmptyStateHtml(), getQueryParam(), getRelativeTime()

### AdminManager (src/admin.js)
- 管理画面全体の統括。各種Managerを束ね、初期化・イベント管理・データ描画・ログイン/ログアウトなどを担当
- プロパティ: api, profile, career, pdf, comments, posts, contacts, adminPassword
- 主なメソッド: initialize(), setupEventListeners(), handleLogin(), handleLogout(), renderAllData(), filterComments(), filterContacts(), toggleCommentApproval(), deleteCommentHandler(), togglePostApproval(), deletePostHandler(), deleteContactHandler(), deletePDFHandler()

### ProfileManager (src/admin.js)
- プロフィールデータの取得・編集・保存を管理
- プロパティ: api, profile
- 主なメソッド: fetch(), loadForm(), save(), handleUpdate()

### CareerManager (src/admin.js)
- キャリア履歴の取得・追加・削除・描画を管理
- プロパティ: api, careers
- 主なメソッド: fetch(), render(), add(), delete(), handleAdd()

### PDFManager (src/admin.js)
- PDFファイルのアップロード・一覧取得・削除・描画を管理
- プロパティ: api, pdfs
- 主なメソッド: fetch(), render(), delete(), handleAdd()

### CommentManager (src/admin.js)
- コメントデータの取得・承認・削除・フィルタリング・統計取得を管理
- プロパティ: api, allComments, filteredComments
- 主なメソッド: fetchAll(), renderComments(), toggleApproval(), delete(), filter(), getStats()

### PostManager (src/admin.js)
- ポスト（相談）データの取得・承認・削除・統計取得を管理
- プロパティ: api, allPosts
- 主なメソッド: fetchAll(), renderPosts(), toggleApproval(), delete(), getStats()

### ContactListManager (src/admin.js)
- お問い合わせデータの取得・削除・フィルタリング・統計取得を管理
- プロパティ: api, allContacts, filteredContacts
- 主なメソッド: fetchAll(), renderContacts(), delete(), filter(), getStats()

### ContactManager (src/contact.js)
- コンタクトフォームページの管理。フォーム初期化・送信処理・ページ初期化を担当
- 主なメソッド: initializeForm(), handleFormSubmit(), initializePage()

---

## 🔄 クラス間の相互作用

- AdminManagerが全体を統括し、各Manager（ProfileManager, CareerManager, PDFManager, CommentManager, PostManager, ContactListManager）をインスタンス化して管理画面の各機能を実現
- 各ManagerはAPIClientを利用してデータ取得・操作を行う
- Utilsはstaticメソッドとして全体で利用
- HTMLのonclickハンドラからwindow.adminManager経由で各機能を呼び出し可能

---

## 📁 ファイル構成（主要部分）

```
src/
├── api.js              # APIClient クラス
├── utils.js            # Utils クラス
├── contact.js          # ContactManager クラス
├── admin.js            # AdminManager, ProfileManager, CareerManager, PDFManager, CommentManager, PostManager, ContactListManager
...
public/
├── admin.html          # 管理画面
├── pdf.html            # PDF画像表示ページ
├── pdf-text.html       # PDFテキスト＆デザイン表示ページ
...
api/
├── cases.ts
├── comments.ts
├── contacts.ts
...
db/
└── client.ts           # Turso データベース接続
uploads/                # PDFファイル保存ディレクトリ
```

---

## 🎯 API エンドポイント一覧（2026年2月時点）

- プロフィール: GET/PUT /api/profile
- キャリア: GET/POST/DELETE /api/career
- PDF: GET/POST/DELETE /api/pdfs, GET /uploads/*
- コメント: GET/POST/PUT/DELETE /api/comments
- ポスト: GET/POST/PUT/DELETE /api/posts
- お問い合わせ: GET/POST/DELETE /api/contacts

---

## ✨ オブジェクト指向設計の利点

- カプセル化: データと操作をクラス単位でまとめ、内部状態を保護
- 再利用性: 共通処理をクラス化し、複数ページで利用可能
- 保守性: 機能ごとにクラス分割し、変更の影響範囲を限定
- 拡張性: 継承やメソッド追加で容易に機能拡張
- 単一責任原則: 各クラスが一つの責務に集中

---

## 📝 最新機能・拡張例（2026年2月）

- PDFファイル管理（アップロード・テキスト抽出・ズーム・表示切替）
- Tursoデータベース連携によるプロフィール・キャリア管理
- コメント・ポスト・お問い合わせの統合管理
- APIClientの拡張（キャッシュ・認証・バリデーション等）
- 各Managerのサブクラス化による自動化・高度化（例: AutoModerationCommentManager, SearchablePDFManager など）

---

## 🔧 技術スタック

- フロントエンド: Vanilla JavaScript（ES6+）、HTML5、CSS3
- API: Viteミドルウェア
- データベース: Turso（libSQL）
- PDF処理: PDF.js
- ビルドツール: Vite
- ホスティング: Vercel（予定）

---

## ✅ チェックリスト（2026年2月時点）

- [x] 主要Managerクラスの実装・統合
- [x] APIClient/Utilsのクラス化
- [x] PDF管理機能の実装
- [x] Turso DB連携
- [x] 管理画面の各種機能（プロフィール・キャリア・PDF・コメント・ポスト・お問い合わせ）
- [x] APIエンドポイントの整備
- [x] グローバルアクセス(window.adminManager)
- [x] テスト・動作確認

---

このドキュメントは2026年2月時点の最新設計・実装方針を反映しています。
