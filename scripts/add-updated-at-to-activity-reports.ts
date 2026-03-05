// scripts/add-updated-at-to-activity-reports.ts
// activity_reportsテーブルにupdated_atカラムを追加するスクリプト

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoToken) {
  console.error("❌ TURSO_AUTH_TOKEN is not set");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function addUpdatedAtColumn() {
  try {
    console.log("🔄 Adding updated_at column to activity_reports...");
    await db.execute("ALTER TABLE activity_reports ADD COLUMN updated_at TEXT;");
    console.log("✅ updated_at column added successfully.");
  } catch (error: any) {
    if (error.message && error.message.includes("duplicate column name")) {
      console.log("⚠️  updated_at column already exists.");
    } else {
      console.error("❌ Error adding updated_at column:", error);
      process.exit(1);
    }
  }
}

addUpdatedAtColumn();
