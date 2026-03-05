// directory: app/api/auth/authenticators/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client';

export async function GET() {
  try {
    // 1. 確実に存在する列だけを指定して取得
    const resultSet = await client.execute({
      sql: `SELECT id, created_at FROM authenticators WHERE user_id = 'admin-001' ORDER BY created_at DESC`,
      args: []
    });

    // 2. ログを出力（Vercelのログで中身を確認するため）
    console.log("Fetched rows:", resultSet.rows);

    // 3. 配列として確実に認識される形で返す
    const data = JSON.parse(JSON.stringify(resultSet.rows));
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ API Route Error:", error.message);
    // エラー内容をブラウザに返して原因を特定しやすくする
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}