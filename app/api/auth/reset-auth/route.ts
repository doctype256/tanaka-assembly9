// directory: app/api/auth/reset-auth/route.ts

import { NextResponse } from 'next/server';
import { client } from '@/db/client.ts';

/**
 * ResetAuth: 既存の認証情報を削除し、顔認証での再登録を可能にする。
 * オブジェクト指向の観点から、特定のユーザーIDに関連付いた認証器をパージします。
 */
export async function POST(req: Request) {
  try {
    const user_id = 'admin-001'; // 現在の対象ユーザー

    // DBから既存の認証器を削除
    await client.execute({
      sql: "DELETE FROM authenticators WHERE user_id = ?",
      args: [user_id]
    });

    return NextResponse.json({ success: true, message: '既存の認証情報をリセットしました。' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}