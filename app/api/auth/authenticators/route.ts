// directory: app/api/auth/authenticators/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client.ts';

/**
 * GET: 登録済み認証器の一覧を取得
 */
export async function GET() {
  try {
    const resultSet = await client.execute({
      sql: `SELECT id, created_at FROM authenticators WHERE user_id = 'admin-001' ORDER BY created_at DESC`,
      args: []
    });

    // TursoのresultSetから純粋な配列を抽出して返す
    return NextResponse.json(resultSet.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}