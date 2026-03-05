// directory: db/client.ts
import "dotenv/config";
import { createClient, Client } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoToken) {
  throw new Error("TURSO_AUTH_TOKEN is not set in environment variables");
}

// 変数名を client に変更し、export const で名前付きエクスポートにする
export const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

console.log("✅ Using Turso database");

// 既存コードへの影響を最小限にするため default も残す（任意）
export default client;


//export default db;
