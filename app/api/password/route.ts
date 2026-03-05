// app/api/change-password/route.ts
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

// ログをファイルに出力する関数
// ログ出力を完全に無効化
function writeLog(message: string) {
  // 何もしない
}

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();

  // ...existing code...

  try {
    // 現在のハッシュを取得
    const result = await db.execute({
      sql: 'SELECT password_hash FROM admins WHERE id = ?',
      args: ['admin'],
    });

    const row = result.rows[0];
    if (!row) {
      writeLog('管理者が存在しません');
      return NextResponse.json({ message: '管理者が存在しません' }, { status: 500 });
    }

    const isValid = await bcrypt.compare(currentPassword, row.password_hash as string);
    writeLog(`パスワード一致: ${isValid}`);

    if (!isValid) {
      writeLog('現在のパスワードが間違っています');
      return NextResponse.json({ message: '現在のパスワードが間違っています' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    writeLog('新しいハッシュ生成完了');

    await db.execute({
      sql: 'UPDATE admins SET password_hash = ? WHERE id = ?',
      args: [newHash, 'admin'],
    });

    writeLog('パスワード更新成功');
    return NextResponse.json({ message: 'パスワードを変更しました' });
  } catch (err) {
    console.error('パスワード変更エラー:', err);
    writeLog(`サーバーエラー: ${err}`);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
