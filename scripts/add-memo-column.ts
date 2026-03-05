// directory: scripts/add-memo-column.ts
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("Database column adding start...");
  try {
    // ALTER TABLEを実行してカラムを追加
    await db.execute("ALTER TABLE consultations ADD COLUMN admin_memo TEXT;");
    console.log("✅ Success: 'admin_memo' column added to 'consultations' table.");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️ Info: Column already exists.");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

main();