# pdfs・活動報告関連コード所在メモ

## pdfs（PDF管理）関連

- 管理クラス: public/js/admin.js → PDFManager クラス
- 管理画面ハンドラー: AdminManager.prototype.handlePDFAdd, AdminManager.prototype.deletePDFHandler
- APIエンドポイント: app/api/pdfs/route.ts
- フロント表示: public/pdf.html, public/pdf-text.html
- アップロード先: uploads/
- APIクライアント: src/api.js（APIClientクラスにPDF関連メソッドがある場合）

## 活動報告関連

- 管理クラス: public/js/admin.js → ActivityReportManager クラス
- 管理画面ハンドラー: AdminManagerクラスの activityReports プロパティ、handleActivityReportAdd など
- APIエンドポイント: app/api/activity-reports/route.ts
- フロント表示: public/policy.html（カテゴリ・年代フィルタ、カルーセル等）
- データ取得・描画: public/js/activity-reports.js

---

必要に応じて、各ファイル・クラスの詳細や実装例も追記可能です。