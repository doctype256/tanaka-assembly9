import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const { email } = body || {};
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
  }

  // ▼ admins テーブル作成（email カラム追加）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `);

  // ▼ password_resets テーブル作成
  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // ▼ admins 初期データ（admin 固定）
  const defaultAdminPassword = "admin777";
  const hashed = await bcrypt.hash(defaultAdminPassword, 10);

  await db.execute(
    `
    INSERT INTO admins (id, password_hash, email)
    VALUES ('admin', ?, 'shendeyong3@gmail.com')
    ON CONFLICT(id) DO NOTHING;
  `,
    [hashed]
  );

  // ▼ DB から管理者メールを取得
  const admin = await db.execute({
    sql: "SELECT email FROM admins WHERE id = 'admin'",
    args: [],
  });

  if (admin.rows.length === 0) {
    return NextResponse.json({ message: "管理者が存在しません" });
  }

  const adminEmail = admin.rows[0].email;

  // ▼ 入力された email が管理者の email と一致するか確認
  if (email !== adminEmail) {
    return NextResponse.json({ message: "メールが登録されていません" });
  }

  // ▼ トークン生成
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 1000 * 60 * 10; // 10分

  await db.execute({
    sql: `
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        token = excluded.token,
        expires_at = excluded.expires_at
    `,
    args: [email, token, expiresAt],
  });

  const resetUrl = `${process.env.APP_URL}/reset-password.html?token=${token}`;

  // ▼ メール送信
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "パスワード再設定リンク",
      html: `
        <p>以下のリンクからパスワードを再設定してください。</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>このリンクは10分間有効です。</p>
      `,
    });
  } catch (error) {
    console.error("メール送信エラー:", error);
    return NextResponse.json({ message: "メール送信に失敗しました" }, { status: 500 });
  }

  console.log("Reset URL:", resetUrl);

  return NextResponse.json({ message: "再設定メールを送信しました" });
}
