// scripts/seed-admin.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function seedAdmin() {
  const password = 'admin'; // 初期パスワード
  const hash = await bcrypt.hash(password, 10);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    );
  `);

  await db.execute({
    sql: `
      INSERT OR REPLACE INTO admins (id, password_hash)
      VALUES (?, ?)
    `,
    args: ['admin', hash],
  });

  console.log('✅ 管理者パスワードを登録しました');
}

seedAdmin();
