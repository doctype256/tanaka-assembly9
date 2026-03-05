// directory: scripts/setup-consultations.ts

import { client } from '../db/client.ts'; // 環境によっては拡張子が必要
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM環境で__dirnameを再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * DatabaseSetup: データベースのマイグレーションと初期化を管理
 */
class DatabaseSetup {
  async run() {
    try {
      console.log("⏳ Database schema updating (Turso/LibSQL)...");

      // 1. consultationsテーブルの作成 / 更新
      await client.execute(`
        CREATE TABLE IF NOT EXISTS consultations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_type TEXT NOT NULL,
          place_type TEXT NOT NULL,
          content_type TEXT NOT NULL,
          suggestion_topic TEXT NOT NULL DEFAULT '未分類',
          needs_reply INTEGER DEFAULT 0,
          email TEXT,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'unread',
          admin_memo TEXT,
          ip_hash TEXT NOT NULL,
          user_agent TEXT,
          referer_url TEXT,
          created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        );
      `);

      // 2. カラムの存在チェックと追加
      await this.ensureColumns();

      // 3. 設定用テーブルの作成
      await client.execute(`
        CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
        );
      `);

      // 4. 初期レコードの登録
      await this.seedInitialSettings();

      console.log("✅ Database schema is now up to date.");
    } catch (error) {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    }
  }

  private async ensureColumns() {
    // PRAGMAはテーブルの構造情報を返す
    const tableInfo = await client.execute("PRAGMA table_info(consultations);");
    const existingColumns = tableInfo.rows.map(row => String(row.name));

    if (!existingColumns.includes('suggestion_topic')) {
      await client.execute(`ALTER TABLE consultations ADD COLUMN suggestion_topic TEXT NOT NULL DEFAULT '未分類';`);
      console.log("➕ Added 'suggestion_topic' column.");
    }

    if (!existingColumns.includes('admin_memo')) {
      await client.execute(`ALTER TABLE consultations ADD COLUMN admin_memo TEXT;`);
      console.log("➕ Added 'admin_memo' column.");
    }
  }

  private async seedInitialSettings() {
    const initialSettings = [
      ['admin_notification_email', ''],
      ['smtp_user', ''],
      ['smtp_pass', '']
    ];

    for (const [key, value] of initialSettings) {
      await client.execute({
        sql: "INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)",
        args: [key, value]
      });
    }
  }
}

const setup = new DatabaseSetup();
setup.run();