// directory: app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { client } from "@/db/client"; // Tursoクライアント

/**
 * 設定取得 (GET): 特定のキーに基づいた設定値を返します
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'キーが必要です' }, { status: 400 });
    }

    const result = await client.execute({
      sql: 'SELECT value FROM site_settings WHERE key = ?',
      args: [key]
    });

    const value = result.rows[0]?.value || '';
    return NextResponse.json({ key, value });
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * 設定保存 (POST): キーに対して値を保存、または更新します
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'キーが必要です' }, { status: 400 });
    }

    /**
     * INSERT OR REPLACE または ON CONFLICT を使用して
     * 既存のキーがあれば更新、なければ挿入を実行します。
     */
    await client.execute({
      sql: `
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now', 'localtime'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now', 'localtime')
      `,
      args: [key, value]
    });

    return NextResponse.json({ success: true, message: '設定を保存しました' });
  } catch (error) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: '設定の保存に失敗しました' }, { status: 500 });
  }
}