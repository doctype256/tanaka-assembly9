// scripts/init-turso.ts
// Turso データベース初期化スクリプト

import { createClient } from "@libsql/client";
import { config } from "dotenv";

// .env.local を読み込み
config({ path: ".env.local" });

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN;

console.log("🔍 Environment check:");
console.log("  TURSO_DATABASE_URL:", tursoUrl);
console.log("  TURSO_AUTH_TOKEN:", tursoToken ? "✓ Set" : "✗ Not set");

if (!tursoToken) {
  console.error("❌ TURSO_AUTH_TOKEN is not set");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function initializeTurso() {
  try {
    console.log("🔄 Initializing Turso database...");

    // 既存テーブルを削除（スキーママイグレーション用）
    await db.execute(`DROP TABLE IF EXISTS posts`);
    await db.execute(`DROP TABLE IF EXISTS profile`);
    await db.execute(`DROP TABLE IF EXISTS Career`);
    console.log("  ✓ Old tables dropped");

    // テーブル作成
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_title TEXT NOT NULL,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        approved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        furigana TEXT,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        approved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        IMG_URL TEXT NOT NULL,
        Name VARCHAR(100) NOT NULL,
        birthday VARCHAR(100) NOT NULL,
        "From" VARCHAR(255) NOT NULL,
        Family TEXT NOT NULL,
        Job VARCHAR(45) NOT NULL,
        hobby TEXT NOT NULL,
        Create_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Career (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year VARCHAR(100) NOT NULL,
        month VARCHAR(100) NOT NULL,
        Content VARCHAR(255) NOT NULL,
        Create_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS PDFs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        created_at TEXT
      )
    `);

    // Profile テーブルに初期データを挿入
    await db.execute({
      sql: `INSERT INTO profile (Name, IMG_URL, birthday, "From", Family, Job, hobby) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "京都府議会<下京区>選出議員 田中　しほ",
        "assets/自己紹介.png",
        "1994年7月21日",
        "京都市",
        "夫・子ども2人",
        "京都府議会議員（下京区）",
        "ボランティア活動"
      ]
    });

    // Career テーブルに初期データを挿入
    const careerData = [
      { year: "2017", month: "", content: "看護師としてICU勤務" },
      { year: "2021", month: "", content: "衆議院議員秘書" },
      { year: "2023", month: "", content: "京都府議会議員 初当選" }
    ];

    for (const career of careerData) {
      await db.execute({
        sql: `INSERT INTO Career (year, month, Content) VALUES (?, ?, ?)`,
        args: [career.year, career.month, career.content]
      });
    }

    console.log("✅ Turso database initialized successfully with profile and career data");
  } catch (error) {
    console.error("❌ Error initializing Turso database:", error);
    process.exit(1);
  }
}

initializeTurso();
