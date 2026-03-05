// directory: app/api/auth/recovery-login/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client'; // .tsを消去（Next.jsの慣習）
import bcrypt from 'bcrypt';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

/**
 * RecoveryLoginAPI: 復旧コードによる認証論理
 * オブジェクト指向に基づき、セッション管理とDB操作を統合。
 */
export async function POST(req: Request) {
  try {
    const { code } = await req.json(); // フロント側は { code: recoveryCode } で送信している

    if (!code) {
      return NextResponse.json({ success: false, error: 'コードを入力してください' }, { status: 400 });
    }

    // 1. 未使用の復旧コードをすべて取得（ユーザーIDは本来セッション等から特定するが、
    // ログイン前なので単一管理者の場合は全検索、複数ならメールアドレス等を併用する論理が必要）
    const resultSet = await client.execute({
      sql: `SELECT id, code_hash FROM recovery_codes WHERE used_at IS NULL`,
      args: []
    });

    const codes = resultSet.rows;
    let matchedCodeId = null;

    // 2. ハッシュ照合
    for (const row of codes) {
      const isMatch = await bcrypt.compare(code, row.code_hash as string);
      if (isMatch) {
        matchedCodeId = row.id;
        break;
      }
    }

    if (!matchedCodeId) {
      return NextResponse.json({ success: false, error: '復旧コードが無効です' }, { status: 401 });
    }

    // 3. 使用済みマーク（一度きり）
    await client.execute({
      sql: `UPDATE recovery_codes SET used_at = datetime('now', 'localtime') WHERE id = ?`,
      args: [matchedCodeId]
    });

    // 4. セッションの発行（現在のミドルウェアの認証ガードを通るようにする）
    const response = NextResponse.json({ success: true });
    const session = await getIronSession(req, response, sessionOptions);
    
    (session as any).isAdmin = true; // 管理者としてマーク
    await session.save();

    return response;

  } catch (error: any) {
    console.error("Recovery Login Error:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}