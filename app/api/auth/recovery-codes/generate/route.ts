// directory: app/api/auth/recovery-codes/generate/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client.ts';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * POST: 復旧コードの新規生成
 * セキュリティポリシーに基づき、ハッシュ化して保存します。
 */
export async function POST() {
  try {
    const userId = 'admin-001'; // 本来はセッション管理から取得
    const rawCodes: string[] = [];
    const saltRounds = 10;

    // 1. 10個のランダムなコードを生成 (例: ABCD-1234)
    for (let i = 0; i < 10; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      rawCodes.push(`${part1}-${part2}`);
    }

    // 2. トランザクションまたは順次実行で古い未使用コードを削除
    // 新しいセットを発行するため、古いものは無効化する
    await client.execute({
      sql: `DELETE FROM recovery_codes WHERE user_id = ? AND used_at IS NULL`,
      args: [userId]
    });

    // 3. ハッシュ化してDBへ保存
    // 開発者がDBを直接見ても、元のコードは不明な状態にする
    for (const code of rawCodes) {
      const hash = await bcrypt.hash(code, saltRounds);
      await client.execute({
        sql: `INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)`,
        args: [userId, hash]
      });
    }

    // 4. 生のコードは「このレスポンス時のみ」返却する
    return NextResponse.json({ codes: rawCodes });

  } catch (error: any) {
    console.error("Recovery Code Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}