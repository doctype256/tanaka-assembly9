// directory: scripts/check-turso.ts
// Turso データベースの内容を確認するスクリプト

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

async function checkTurso() {
  try {
    console.log("🔍 Checking Turso database...\n");

    // 1. コメント数を確認
    const commentsResult = await db.execute("SELECT COUNT(*) as count FROM comments");
    const commentCount = Number(commentsResult.rows[0]?.count || 0);
    console.log(`📝 Comments: ${commentCount}`);

    if (commentCount > 0) {
      const allComments = await db.execute("SELECT name, message FROM comments ORDER BY created_at DESC LIMIT 3");
      console.log("   Recent comments:");
      allComments.rows.forEach((c: any, i) => console.log(`   ${i + 1}. ${c.name} - ${c.message.substring(0, 30)}...`));
    }

    // 2. お問い合わせ数を確認
    const contactsResult = await db.execute("SELECT COUNT(*) as count FROM contacts");
    const contactCount = Number(contactsResult.rows[0]?.count || 0);
    console.log(`\n📧 Contacts: ${contactCount}`);

    if (contactCount > 0) {
      const allContacts = await db.execute("SELECT name, email FROM contacts ORDER BY created_at DESC LIMIT 3");
      console.log("   Recent contacts:");
      allContacts.rows.forEach((c: any, i) => console.log(`   ${i + 1}. ${c.name} (${c.email})`));
    }

    // --- 相談ポスト（consultations）の確認を追加 ---
    try {
      const consultationsResult = await db.execute("SELECT COUNT(*) as count FROM consultations");
      const consultationCount = Number(consultationsResult.rows[0]?.count || 0);
      console.log(`\n📥 Consultations: ${consultationCount}`);

      if (consultationCount > 0) {
        const recentConsults = await db.execute("SELECT target_type, message, created_at FROM consultations ORDER BY created_at DESC LIMIT 3");
        console.log("   Recent consultations:");
        recentConsults.rows.forEach((c: any, i) => console.log(`   ${i + 1}. [${c.target_type}] ${c.message.substring(0, 30)}...`));
      }
    } catch (e) {
      console.log("\n📥 Consultations: (Table not found or error)");
    }

    // --- 全テーブル一覧確認 ---
    console.log("\n--- 📂 全テーブル詳細確認 (Top 5 records) ---");
    
    const tablesRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const tableNames = tablesRes.rows.map(row => row.name as string);

    for (const tableName of tableNames) {
      // 既に個別サマリーを出したものは簡易表示にしたい場合はここで制御
      const content = await db.execute(`SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 5;`);
      console.log(`\n📊 TABLE: ${tableName} (${content.rows.length} records shown)`);
      
      if (content.rows.length > 0) {
        console.table(content.rows);
      } else {
        console.log("   (データなし)");
      }
    }

    console.log("\n✅ Turso database check complete");
  } catch (error) {
    console.error("❌ Error checking Turso database:", error);
    process.exit(1);
  }
}

checkTurso();