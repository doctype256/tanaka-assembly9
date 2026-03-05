// app/api/reset-password/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// ▼ ログ出力関数（change-password と同じ）
// ログ出力を完全に無効化
function writeLog(message: string) {
  // 何もしない
}

export async function POST(req: NextRequest) {
  writeLog('--- パスワードリセット API 呼び出し ---');

  try {
    const { token, password } = await req.json();

    writeLog(`受信 token: ${token}`);
    writeLog(`受信 password: ${password}`);

    if (!token || !password) {
      writeLog('トークンまたはパスワードが不足');
      return NextResponse.json(
        { message: 'トークンまたはパスワードが不足しています' },
        { status: 400 }
      );
    }

    // ▼ トークン確認
    const result = await db.execute({
      sql: 'SELECT email, expires_at FROM password_resets WHERE token = ?',
      args: [token],
    });

    if (result.rows.length === 0) {
      writeLog('無効なトークン');
      return NextResponse.json(
        { message: '無効なトークンです' },
        { status: 400 }
      );
    }

    const { email, expires_at } = result.rows[0];
    writeLog(`DB から取得 email: ${email}`);
    writeLog(`expires_at: ${expires_at}`);

    // ▼ 有効期限チェック
    if (Date.now() > Number(expires_at)) {
      writeLog('トークン期限切れ');
      return NextResponse.json(
        { message: 'トークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // ▼ パスワードハッシュ化
    const newHash = await bcrypt.hash(password, 10);
    writeLog('新しいパスワードのハッシュ生成完了');

    // ▼ ★ 常に admin のパスワードを更新（メールアドレスは使わない）
    await db.execute({
      sql: 'UPDATE admins SET password_hash = ? WHERE id = ?',
      args: [newHash, 'admin'],
    });

    writeLog('admins テーブルの admin パスワード更新完了');

    // ▼ トークン削除（再利用防止）
    await db.execute({
      sql: 'DELETE FROM password_resets WHERE email = ?',
      args: [email],
    });

    writeLog('password_resets のトークン削除完了');
    writeLog('パスワードリセット成功');

    return NextResponse.json({ message: 'パスワードを更新しました' });
  } catch (err) {
    console.error('reset-password API エラー:', err);
    writeLog(`サーバーエラー: ${err}`);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
