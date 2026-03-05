import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve("data", "local.db");
const db = new Database(dbPath);

// テーブルがなければ作る
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`).run();

// 初期データ（1回だけ入る）
const count = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
if (count === 0) {
  db.prepare("INSERT INTO users (name) VALUES (?)").run("Tanaka");
  db.prepare("INSERT INTO users (name) VALUES (?)").run("Suzuki");
}

export default db;

