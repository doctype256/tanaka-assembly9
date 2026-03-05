import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { createClient } from "@libsql/client";
import { IronSession } from "iron-session";
import bcrypt from "bcryptjs";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const MAX_ATTEMPTS = 3;
const LOCK_TIME = 3 * 60 * 1000; // 3分

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  const res = NextResponse.json({ message: "ログイン成功！" });
  const session = await getIronSession(req, res, sessionOptions);

  try {
    // テーブル作成
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip TEXT PRIMARY KEY,
        failed_count INTEGER DEFAULT 0,
        lock_until INTEGER DEFAULT 0
      );
    `);

    // ロック状態確認
    const attemptResult = await db.execute({
      sql: "SELECT failed_count, lock_until FROM login_attempts WHERE ip = ?",
      args: [ip],
    });

    const attemptRow = attemptResult.rows[0];
    const failedCount = attemptRow ? Number(attemptRow.failed_count) : 0;
    const lockUntil = attemptRow ? Number(attemptRow.lock_until) : 0;

    if (lockUntil && now < lockUntil) {
      return NextResponse.json(
        { message: "ロック中です。しばらくしてから再試行してください。" },
        { status: 429 }
      );
    }

    // 管理者パスワード取得
    const adminResult = await db.execute({
      sql: "SELECT password_hash FROM admins WHERE id = ?",
      args: ["admin"],
    });

    const adminRow = adminResult.rows[0];
    if (!adminRow) {
      return NextResponse.json(
        { message: "管理者が登録されていません" },
        { status: 500 }
      );
    }

    const isValid = await bcrypt.compare(
      password,
      adminRow.password_hash as string
    );

    if (!isValid) {
      const newFailedCount = failedCount + 1;
      const newLockUntil =
        newFailedCount >= MAX_ATTEMPTS ? now + LOCK_TIME : 0;

      await db.execute({
        sql: `
          INSERT INTO login_attempts (ip, failed_count, lock_until)
          VALUES (?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET
            failed_count = excluded.failed_count,
            lock_until = excluded.lock_until
        `,
        args: [ip, newFailedCount, newLockUntil],
      });

      const msg =
        newFailedCount >= MAX_ATTEMPTS
          ? "3回間違えたので3分間ロックされました"
          : "パスワードが間違っています";

      return NextResponse.json({ message: msg }, { status: 401 });
    }

    // 成功：ログ削除 & セッション保存
    await db.execute({
      sql: "DELETE FROM login_attempts WHERE ip = ?",
      args: [ip],
    });

    (session as IronSession<{ isAdmin?: boolean }>).isAdmin = true;
    await session.save();

    return res;
  } catch (err) {
    console.error("ログインAPIエラー:", err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
