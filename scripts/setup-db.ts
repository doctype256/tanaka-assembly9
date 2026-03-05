// directory: scripts/setup-db.ts

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken!,
});

async function setup() {
  console.log("🚀 Starting database setup...");

  try {
    // テーブル作成
    console.log("Creating 'consultations' table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_type TEXT NOT NULL,
        place_type TEXT NOT NULL,
        content_type TEXT NOT NULL,
        needs_reply INTEGER DEFAULT 0,
        email TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        ip_hash TEXT NOT NULL,
        user_agent TEXT,
        referer_url TEXT,
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // インデックス作成
    console.log("Creating indexes...");
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_consultation_limit ON consultations (ip_hash, created_at);
    `);

    console.log("✅ Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Error during setup:", error);
  }
}

setup();